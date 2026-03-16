import { Command } from 'commander';
import { formatEther } from 'viem';
import { printSection, printError, printSuccess, printKeyValue, printWarning, printTxLink, createTable, createSpinner, styled, formatPrice, formatAddress, newLine, } from '../lib/ui.js';
import { isWalletConfigured, getWalletAddress } from '../lib/wallet.js';
import { getNativeBalance, getTokenInfo } from '../lib/client.js';
import { promptPassword, promptConfirm, promptLeverage, promptSelect } from '../lib/prompts.js';
import { openPosition, closePosition, getAllUserPositions, getPosition, getPositionPnL, getLiquidationPrice, getPerpetualPrice, getCurrentPrice, } from '../lib/contracts.js';
import { searchTokens } from '../lib/subgraph.js';
// Resolve token symbol to address
async function resolveToken(tokenInput) {
    if (tokenInput.startsWith('0x') && tokenInput.length === 42) {
        return tokenInput;
    }
    const tokens = await searchTokens(tokenInput);
    const exactMatch = tokens.find(t => t.symbol.toLowerCase() === tokenInput.toLowerCase());
    return exactMatch ? exactMatch.address : null;
}
export const perpCommand = new Command('perp')
    .description('Perpetual trading commands');
// Open position
perpCommand
    .command('open <token>')
    .description('Open a perpetual position')
    .option('-s, --side <side>', 'Position side: long or short', 'long')
    .option('-m, --margin <amount>', 'Margin amount in MNT')
    .option('-l, --leverage <number>', 'Leverage multiplier (1-100)')
    .action(async (token, options) => {
    try {
        // Check wallet
        if (!isWalletConfigured()) {
            printError('No wallet configured', 'Run "pike wallet setup" first');
            process.exit(1);
        }
        const walletAddress = getWalletAddress();
        // Resolve token (symbol or address)
        const spinner = createSpinner('Checking token...').start();
        const tokenAddress = await resolveToken(token);
        if (!tokenAddress) {
            spinner.fail('Token not found');
            printError('Could not find token', 'Use token address or symbol (e.g., MLML)');
            process.exit(1);
        }
        let tokenInfo;
        try {
            tokenInfo = await getTokenInfo(tokenAddress);
        }
        catch {
            spinner.fail('Invalid token');
            printError('Could not fetch token info');
            process.exit(1);
        }
        // Get current price
        let price = (await getPerpetualPrice(tokenAddress)).price;
        if (price === 0n) {
            // Try bonding curve price
            price = await getCurrentPrice(tokenAddress);
        }
        spinner.succeed('Token found');
        // Get position parameters
        let isLong;
        if (options.side) {
            isLong = options.side.toLowerCase() === 'long';
        }
        else {
            const side = await promptSelect('Position side', [
                { name: 'LONG', value: 'long', description: 'Profit when price goes up' },
                { name: 'SHORT', value: 'short', description: 'Profit when price goes down' },
            ]);
            isLong = side === 'long';
        }
        // Get margin
        let margin = options.margin;
        if (!margin) {
            const balance = await getNativeBalance(walletAddress);
            console.log(styled.muted(`  Available balance: ${formatEther(balance)} MNT`));
            const { amount } = await import('inquirer').then(m => m.default.prompt([{
                    type: 'input',
                    name: 'amount',
                    message: 'Margin amount (MNT):',
                    validate: (input) => {
                        const num = parseFloat(input);
                        if (isNaN(num) || num <= 0)
                            return 'Enter a valid amount';
                        return true;
                    },
                }]));
            margin = amount;
        }
        // Get leverage
        let leverage = options.leverage ? parseInt(options.leverage) : undefined;
        if (!leverage) {
            leverage = await promptLeverage();
        }
        // Calculate position details
        const marginNum = parseFloat(margin);
        const positionSize = marginNum * leverage;
        const priceNum = Number(price) / 1e8;
        // Calculate estimated liquidation price (simplified)
        const liquidationBuffer = 0.9; // 90% of margin as maintenance
        const liquidationPriceNum = isLong
            ? priceNum * (1 - liquidationBuffer / leverage)
            : priceNum * (1 + liquidationBuffer / leverage);
        // Check balance
        const balance = await getNativeBalance(walletAddress);
        const marginWei = BigInt(Math.floor(marginNum * 1e18));
        if (balance < marginWei) {
            printError('Insufficient balance', `You need ${margin} MNT but have ${formatEther(balance)} MNT`);
            process.exit(1);
        }
        // Display position details
        printSection('Position Details');
        printKeyValue('Token', `${tokenInfo.symbol} (${tokenInfo.name})`);
        printKeyValue('Side', isLong ? styled.long('LONG') : styled.short('SHORT'));
        printKeyValue('Margin', `${margin} MNT`);
        printKeyValue('Leverage', `${leverage}x`);
        printKeyValue('Position Size', `${positionSize.toFixed(2)} MNT`);
        printKeyValue('Entry Price', formatPrice(priceNum));
        printKeyValue('Est. Liq. Price', styled.warning(formatPrice(liquidationPriceNum)));
        newLine();
        // Confirm
        const confirmed = await promptConfirm('Open this position?', false);
        if (!confirmed) {
            printWarning('Position cancelled');
            return;
        }
        // Get password
        const password = await promptPassword('Enter wallet password');
        // Open position
        const txSpinner = createSpinner('Opening position...').start();
        try {
            const { hash, positionId } = await openPosition(tokenAddress, isLong, margin, leverage, password);
            txSpinner.succeed('Position opened!');
            newLine();
            printSuccess(`Opened ${isLong ? 'LONG' : 'SHORT'} position on ${tokenInfo.symbol}`);
            printKeyValue('Position ID', styled.bold(positionId.toString()));
            printTxLink(hash);
        }
        catch (error) {
            txSpinner.fail('Failed to open position');
            printError(error.message);
            process.exit(1);
        }
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// Close position
perpCommand
    .command('close <positionId>')
    .description('Close a perpetual position')
    .action(async (positionIdStr) => {
    try {
        // Check wallet
        if (!isWalletConfigured()) {
            printError('No wallet configured', 'Run "pike wallet setup" first');
            process.exit(1);
        }
        const positionId = BigInt(positionIdStr);
        // Get position details
        const spinner = createSpinner('Fetching position...').start();
        const position = await getPosition(positionId);
        if (!position) {
            spinner.fail('Position not found');
            printError('Could not find position with this ID');
            process.exit(1);
        }
        if (!position.isOpen) {
            spinner.fail('Position already closed');
            printError('This position is already closed');
            process.exit(1);
        }
        // Get token info
        let tokenSymbol = 'TOKEN';
        try {
            const tokenInfo = await getTokenInfo(position.token);
            tokenSymbol = tokenInfo.symbol;
        }
        catch {
            // Use address if token info not available
        }
        // Get PnL
        const { pnl, isProfit } = await getPositionPnL(positionId);
        spinner.succeed('Position found');
        // Display position
        printSection('Close Position');
        printKeyValue('Position ID', positionId.toString());
        printKeyValue('Token', tokenSymbol);
        printKeyValue('Side', position.isLong ? styled.long('LONG') : styled.short('SHORT'));
        printKeyValue('Size', `${position.size} MNT`);
        printKeyValue('Margin', `${position.margin} MNT`);
        printKeyValue('Entry Price', formatPrice(parseFloat(position.entryPrice)));
        printKeyValue('PnL', styled.pnl(formatEther(pnl) + ' MNT', isProfit));
        newLine();
        // Confirm
        const confirmed = await promptConfirm('Close this position?', false);
        if (!confirmed) {
            printWarning('Close cancelled');
            return;
        }
        // Get password
        const password = await promptPassword('Enter wallet password');
        // Close position
        const txSpinner = createSpinner('Closing position...').start();
        try {
            const hash = await closePosition(positionId, password);
            txSpinner.succeed('Position closed!');
            newLine();
            printSuccess(`Closed position #${positionId}`);
            printKeyValue('Realized PnL', styled.pnl(formatEther(pnl) + ' MNT', isProfit));
            printTxLink(hash);
        }
        catch (error) {
            txSpinner.fail('Failed to close position');
            printError(error.message);
            process.exit(1);
        }
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// List positions
perpCommand
    .command('list')
    .description('List your open positions')
    .action(async () => {
    try {
        // Check wallet
        if (!isWalletConfigured()) {
            printError('No wallet configured', 'Run "pike wallet setup" first');
            process.exit(1);
        }
        const walletAddress = getWalletAddress();
        const spinner = createSpinner('Fetching positions...').start();
        const positions = await getAllUserPositions(walletAddress);
        spinner.succeed(`Found ${positions.length} open position(s)`);
        if (positions.length === 0) {
            console.log(styled.muted('  No open positions'));
            return;
        }
        printSection('Open Positions');
        const table = createTable(['ID', 'Token', 'Side', 'Size', 'Entry', 'PnL']);
        for (const pos of positions) {
            // Try to get token symbol
            let tokenSymbol = formatAddress(pos.token);
            try {
                const tokenInfo = await getTokenInfo(pos.token);
                tokenSymbol = tokenInfo.symbol;
            }
            catch {
                // Keep address
            }
            const pnlStr = pos.pnl
                ? styled.pnl(pos.pnl + ' MNT', pos.pnlIsProfit || false)
                : styled.muted('--');
            table.push([
                pos.positionId.toString(),
                tokenSymbol,
                pos.isLong ? styled.long('LONG') : styled.short('SHORT'),
                pos.size + ' MNT',
                formatPrice(parseFloat(pos.entryPrice)),
                pnlStr,
            ]);
        }
        newLine();
        console.log(table.toString());
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// Show PnL
perpCommand
    .command('pnl [positionId]')
    .description('Show P&L for position(s)')
    .action(async (positionIdStr) => {
    try {
        // Check wallet
        if (!isWalletConfigured()) {
            printError('No wallet configured', 'Run "pike wallet setup" first');
            process.exit(1);
        }
        const walletAddress = getWalletAddress();
        if (positionIdStr) {
            // Show specific position
            const positionId = BigInt(positionIdStr);
            const spinner = createSpinner('Fetching position...').start();
            const position = await getPosition(positionId);
            if (!position) {
                spinner.fail('Position not found');
                printError('Could not find position');
                process.exit(1);
            }
            const { pnl, isProfit } = await getPositionPnL(positionId);
            const liqPrice = await getLiquidationPrice(positionId);
            // Get current price
            let currentPrice = (await getPerpetualPrice(position.token)).price;
            if (currentPrice === 0n) {
                currentPrice = await getCurrentPrice(position.token);
            }
            let tokenSymbol = 'TOKEN';
            try {
                const tokenInfo = await getTokenInfo(position.token);
                tokenSymbol = tokenInfo.symbol;
            }
            catch {
                // Keep default
            }
            spinner.succeed('Position loaded');
            printSection(`Position #${positionId} - ${tokenSymbol}`);
            printKeyValue('Side', position.isLong ? styled.long('LONG') : styled.short('SHORT'));
            printKeyValue('Size', `${position.size} MNT`);
            printKeyValue('Margin', `${position.margin} MNT`);
            printKeyValue('Leverage', `${position.leverage}x`);
            newLine();
            printKeyValue('Entry Price', formatPrice(parseFloat(position.entryPrice)));
            printKeyValue('Current Price', formatPrice(Number(currentPrice) / 1e8));
            printKeyValue('Liquidation Price', styled.warning(formatPrice(Number(liqPrice) / 1e8)));
            newLine();
            printKeyValue('Unrealized PnL', styled.pnl(formatEther(pnl) + ' MNT', isProfit));
            const pnlPercent = (Number(pnl) / (parseFloat(position.margin) * 1e18)) * 100;
            printKeyValue('PnL %', styled.pnl(`${pnlPercent.toFixed(2)}%`, isProfit));
        }
        else {
            // Show all positions
            const spinner = createSpinner('Fetching positions...').start();
            const positions = await getAllUserPositions(walletAddress);
            if (positions.length === 0) {
                spinner.succeed('No open positions');
                return;
            }
            spinner.succeed(`Found ${positions.length} position(s)`);
            printSection('Position PnL Summary');
            let totalPnl = 0n;
            for (const pos of positions) {
                const { pnl, isProfit } = await getPositionPnL(pos.positionId);
                totalPnl += isProfit ? pnl : -pnl;
                let tokenSymbol = formatAddress(pos.token);
                try {
                    const tokenInfo = await getTokenInfo(pos.token);
                    tokenSymbol = tokenInfo.symbol;
                }
                catch {
                    // Keep address
                }
                console.log(`  #${pos.positionId} ${tokenSymbol} ${pos.isLong ? styled.long('LONG') : styled.short('SHORT')}: ` +
                    styled.pnl(formatEther(pnl) + ' MNT', isProfit));
            }
            newLine();
            const totalIsProfit = totalPnl >= 0n;
            printKeyValue('Total PnL', styled.pnl(formatEther(totalIsProfit ? totalPnl : -totalPnl) + ' MNT', totalIsProfit));
        }
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
export default perpCommand;
//# sourceMappingURL=perp.js.map