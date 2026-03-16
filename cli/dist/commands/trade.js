import { Command } from 'commander';
import { formatEther, parseEther } from 'viem';
import { printSection, printError, printSuccess, printKeyValue, printWarning, printTxLink, createSpinner, styled, formatPrice, formatTokenAmount, formatEth, newLine, } from '../lib/ui.js';
import { isWalletConfigured, getWalletAddress } from '../lib/wallet.js';
import { getNativeBalance, getTokenInfo, getTokenBalance } from '../lib/client.js';
import { promptPassword, promptConfirm } from '../lib/prompts.js';
import { getBuyQuote, getSellQuote, buyTokens, sellTokens, isTokenListed, getCurrentPrice, } from '../lib/contracts.js';
import { searchTokens } from '../lib/subgraph.js';
// Resolve token symbol to address
async function resolveToken(tokenInput) {
    // If it's already an address, return it
    if (tokenInput.startsWith('0x') && tokenInput.length === 42) {
        return tokenInput;
    }
    // Search for token by symbol
    const tokens = await searchTokens(tokenInput);
    const exactMatch = tokens.find(t => t.symbol.toLowerCase() === tokenInput.toLowerCase());
    if (exactMatch) {
        return exactMatch.address;
    }
    return null;
}
export const tradeCommand = new Command('trade')
    .description('Trade tokens on the bonding curve');
// Buy tokens
tradeCommand
    .command('buy <token> <amount>')
    .description('Buy tokens with MNT')
    .option('-s, --slippage <percent>', 'Slippage tolerance in percent', '1')
    .action(async (token, amount, options) => {
    try {
        // Check wallet
        if (!isWalletConfigured()) {
            printError('No wallet configured', 'Run "pike wallet setup" first');
            process.exit(1);
        }
        const walletAddress = getWalletAddress();
        const slippage = parseFloat(options.slippage);
        // Resolve token (symbol or address)
        const spinner = createSpinner('Checking token...').start();
        const tokenAddress = await resolveToken(token);
        if (!tokenAddress) {
            spinner.fail('Token not found');
            printError('Could not find token', 'Use token address or symbol (e.g., MLML)');
            process.exit(1);
        }
        const listed = await isTokenListed(tokenAddress);
        if (!listed) {
            spinner.fail('Token not listed');
            printError('Token is not listed on the bonding curve');
            process.exit(1);
        }
        // Get token info
        let tokenInfo;
        try {
            tokenInfo = await getTokenInfo(tokenAddress);
        }
        catch {
            spinner.fail('Invalid token');
            printError('Could not fetch token info');
            process.exit(1);
        }
        // Check balance
        const balance = await getNativeBalance(walletAddress);
        const amountWei = parseEther(amount);
        if (balance < amountWei) {
            spinner.fail('Insufficient balance');
            printError(`Insufficient MNT balance`, `You have ${formatEther(balance)} MNT but need ${amount} MNT`);
            process.exit(1);
        }
        // Get quote
        const quote = await getBuyQuote(tokenAddress, amount);
        spinner.succeed('Quote received');
        // Display quote
        printSection('Buy Quote');
        printKeyValue('Token', `${tokenInfo.symbol} (${tokenInfo.name})`);
        printKeyValue('You pay', styled.warning(`${amount} MNT`));
        printKeyValue('You receive', styled.success(formatTokenAmount(quote.tokensOut) + ` ${tokenInfo.symbol}`));
        printKeyValue('Average price', formatPrice(Number(quote.avgPrice) / 1e8));
        printKeyValue('Fee', formatEth(formatEther(quote.fee)));
        printKeyValue('Price impact', `${quote.priceImpact.toFixed(2)}%`);
        printKeyValue('Slippage tolerance', `${slippage}%`);
        newLine();
        // Confirm
        const confirmed = await promptConfirm('Execute this trade?', false);
        if (!confirmed) {
            printWarning('Trade cancelled');
            return;
        }
        // Get password
        const password = await promptPassword('Enter wallet password');
        // Calculate min tokens with slippage
        const slippageBps = BigInt(Math.floor(slippage * 100));
        const minTokens = quote.tokensOut - (quote.tokensOut * slippageBps / 10000n);
        // Execute trade
        const txSpinner = createSpinner('Sending transaction...').start();
        try {
            const { hash, tokensReceived } = await buyTokens(tokenAddress, amount, minTokens, password);
            txSpinner.succeed('Transaction confirmed!');
            newLine();
            printSuccess(`Bought ${formatTokenAmount(tokensReceived)} ${tokenInfo.symbol} for ${amount} MNT`);
            printTxLink(hash);
        }
        catch (error) {
            txSpinner.fail('Transaction failed');
            printError(error.message);
            process.exit(1);
        }
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// Sell tokens
tradeCommand
    .command('sell <token> <amount>')
    .description('Sell tokens for MNT')
    .option('-s, --slippage <percent>', 'Slippage tolerance in percent', '1')
    .action(async (token, amount, options) => {
    try {
        // Check wallet
        if (!isWalletConfigured()) {
            printError('No wallet configured', 'Run "pike wallet setup" first');
            process.exit(1);
        }
        const walletAddress = getWalletAddress();
        const slippage = parseFloat(options.slippage);
        // Resolve token (symbol or address)
        const spinner = createSpinner('Checking token...').start();
        const tokenAddress = await resolveToken(token);
        if (!tokenAddress) {
            spinner.fail('Token not found');
            printError('Could not find token', 'Use token address or symbol (e.g., MLML)');
            process.exit(1);
        }
        const listed = await isTokenListed(tokenAddress);
        if (!listed) {
            spinner.fail('Token not listed');
            printError('Token is not listed on the bonding curve');
            process.exit(1);
        }
        // Get token info
        let tokenInfo;
        try {
            tokenInfo = await getTokenInfo(tokenAddress);
        }
        catch {
            spinner.fail('Invalid token');
            printError('Could not fetch token info');
            process.exit(1);
        }
        // Check token balance
        const tokenBalance = await getTokenBalance(tokenAddress, walletAddress);
        const amountWei = parseEther(amount);
        if (tokenBalance < amountWei) {
            spinner.fail('Insufficient token balance');
            printError(`Insufficient ${tokenInfo.symbol} balance`, `You have ${formatTokenAmount(tokenBalance)} but want to sell ${amount}`);
            process.exit(1);
        }
        // Get quote
        const quote = await getSellQuote(tokenAddress, amount);
        spinner.succeed('Quote received');
        // Display quote
        printSection('Sell Quote');
        printKeyValue('Token', `${tokenInfo.symbol} (${tokenInfo.name})`);
        printKeyValue('You sell', styled.warning(`${amount} ${tokenInfo.symbol}`));
        printKeyValue('You receive', styled.success(formatEth(formatEther(quote.ethOut))));
        printKeyValue('Average price', formatPrice(Number(quote.avgPrice) / 1e8));
        printKeyValue('Fee', formatEth(formatEther(quote.fee)));
        printKeyValue('Price impact', `${quote.priceImpact.toFixed(2)}%`);
        printKeyValue('Slippage tolerance', `${slippage}%`);
        newLine();
        // Confirm
        const confirmed = await promptConfirm('Execute this trade?', false);
        if (!confirmed) {
            printWarning('Trade cancelled');
            return;
        }
        // Get password
        const password = await promptPassword('Enter wallet password');
        // Calculate min ETH with slippage
        const slippageBps = BigInt(Math.floor(slippage * 100));
        const minEth = quote.ethOut - (quote.ethOut * slippageBps / 10000n);
        // Execute trade
        const txSpinner = createSpinner('Approving and sending transaction...').start();
        try {
            const { hash, ethReceived } = await sellTokens(tokenAddress, amount, minEth, password);
            txSpinner.succeed('Transaction confirmed!');
            newLine();
            printSuccess(`Sold ${amount} ${tokenInfo.symbol} for ${formatEther(ethReceived)} MNT`);
            printTxLink(hash);
        }
        catch (error) {
            txSpinner.fail('Transaction failed');
            printError(error.message);
            process.exit(1);
        }
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// Get quote only
tradeCommand
    .command('quote <token> <amount>')
    .description('Get a buy/sell quote without executing')
    .option('-t, --type <type>', 'Quote type: buy or sell', 'buy')
    .action(async (token, amount, options) => {
    try {
        const spinner = createSpinner('Fetching quote...').start();
        // Resolve token
        const tokenAddress = await resolveToken(token);
        if (!tokenAddress) {
            spinner.fail('Token not found');
            printError('Could not find token', 'Use token address or symbol (e.g., MLML)');
            process.exit(1);
        }
        const listed = await isTokenListed(tokenAddress);
        if (!listed) {
            spinner.fail('Token not listed');
            printError('Token is not listed on the bonding curve');
            process.exit(1);
        }
        // Get token info
        let tokenInfo;
        try {
            tokenInfo = await getTokenInfo(tokenAddress);
        }
        catch {
            spinner.fail('Invalid token');
            printError('Could not fetch token info');
            process.exit(1);
        }
        const currentPrice = await getCurrentPrice(tokenAddress);
        if (options.type === 'buy') {
            const quote = await getBuyQuote(tokenAddress, amount);
            spinner.succeed('Buy quote received');
            printSection(`Buy ${tokenInfo.symbol}`);
            printKeyValue('Current Price', formatPrice(Number(currentPrice) / 1e8));
            newLine();
            printKeyValue('Input', `${amount} MNT`);
            printKeyValue('Output', `${formatTokenAmount(quote.tokensOut)} ${tokenInfo.symbol}`);
            printKeyValue('Average Price', formatPrice(Number(quote.avgPrice) / 1e8));
            printKeyValue('Fee', formatEth(formatEther(quote.fee)));
            printKeyValue('Price Impact', `${quote.priceImpact.toFixed(2)}%`);
        }
        else {
            const quote = await getSellQuote(tokenAddress, amount);
            spinner.succeed('Sell quote received');
            printSection(`Sell ${tokenInfo.symbol}`);
            printKeyValue('Current Price', formatPrice(Number(currentPrice) / 1e8));
            newLine();
            printKeyValue('Input', `${amount} ${tokenInfo.symbol}`);
            printKeyValue('Output', formatEth(formatEther(quote.ethOut)));
            printKeyValue('Average Price', formatPrice(Number(quote.avgPrice) / 1e8));
            printKeyValue('Fee', formatEth(formatEther(quote.fee)));
            printKeyValue('Price Impact', `${quote.priceImpact.toFixed(2)}%`);
        }
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
export default tradeCommand;
//# sourceMappingURL=trade.js.map