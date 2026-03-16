import { Command } from 'commander';
import { printSection, printError, printKeyValue, createTable, createSpinner, styled, formatPrice, formatNumber, formatAddress, formatTimeAgo, progressBar, newLine, } from '../lib/ui.js';
import { fetchTokens, fetchTrendingTokens, searchTokens, fetchTokenInfo } from '../lib/subgraph.js';
import { getCurrentPrice, getCurveProgress, isTokenListed } from '../lib/contracts.js';
import { getTokenInfo } from '../lib/client.js';
import { formatEther } from 'viem';
export const tokensCommand = new Command('tokens')
    .description('Token listing and information');
// List all tokens
tokensCommand
    .command('list')
    .description('List all available tokens')
    .option('-l, --limit <number>', 'Number of tokens to show', '20')
    .action(async (options) => {
    try {
        const limit = parseInt(options.limit);
        let tokens;
        try {
            tokens = await fetchTokens(limit);
        }
        catch {
            printError('Could not fetch tokens', 'Subgraph may be unavailable');
            return;
        }
        if (tokens.length === 0) {
            console.log(styled.muted('  No tokens found'));
            return;
        }
        printSection(`Tokens (${tokens.length})`);
        const table = createTable(['Symbol', 'Name', 'Price', 'Volume', 'Age']);
        for (const token of tokens) {
            const price = parseFloat(token.currentPrice) / 1e8;
            const volume = parseFloat(formatEther(BigInt(token.totalVolume || '0')));
            table.push([
                styled.bold(token.symbol),
                token.name.length > 20 ? token.name.slice(0, 17) + '...' : token.name,
                formatPrice(price),
                formatNumber(volume) + ' MNT',
                formatTimeAgo(token.createdAt),
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
// Show trending tokens
tokensCommand
    .command('trending')
    .description('Show trending tokens by volume')
    .option('-l, --limit <number>', 'Number of tokens to show', '10')
    .action(async (options) => {
    try {
        const limit = parseInt(options.limit);
        let tokens;
        try {
            tokens = await fetchTrendingTokens(limit);
        }
        catch {
            printError('Could not fetch trending tokens', 'Subgraph may be unavailable');
            return;
        }
        if (tokens.length === 0) {
            console.log(styled.muted('  No tokens found'));
            return;
        }
        printSection('Trending Tokens');
        const table = createTable(['#', 'Symbol', 'Price', 'Volume', 'Trades']);
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const price = parseFloat(token.currentPrice) / 1e8;
            const volume = parseFloat(formatEther(BigInt(token.totalVolume || '0')));
            table.push([
                styled.muted(`${i + 1}`),
                styled.bold(token.symbol),
                formatPrice(price),
                formatNumber(volume) + ' MNT',
                token.totalTrades.toString(),
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
// Search tokens
tokensCommand
    .command('search <query>')
    .description('Search tokens by name or symbol')
    .action(async (query) => {
    try {
        let tokens;
        try {
            tokens = await searchTokens(query);
        }
        catch {
            printError('Could not search tokens', 'Subgraph may be unavailable');
            return;
        }
        if (tokens.length === 0) {
            console.log(styled.muted(`  No tokens matching "${query}"`));
            return;
        }
        printSection(`Search: "${query}" (${tokens.length} results)`);
        const table = createTable(['Symbol', 'Name', 'Address', 'Price']);
        for (const token of tokens) {
            const price = parseFloat(token.currentPrice) / 1e8;
            table.push([
                styled.bold(token.symbol),
                token.name.length > 25 ? token.name.slice(0, 22) + '...' : token.name,
                formatAddress(token.address),
                formatPrice(price),
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
// Token info
tokensCommand
    .command('info <address>')
    .description('Show detailed information about a token')
    .action(async (address) => {
    try {
        const spinner = createSpinner('Fetching token info...').start();
        // Get basic token info from chain
        let tokenInfo;
        try {
            tokenInfo = await getTokenInfo(address);
        }
        catch {
            spinner.fail('Token not found');
            printError('Could not fetch token info', 'Make sure the address is a valid token');
            return;
        }
        // Get price and curve info
        const [price, listed, progress] = await Promise.all([
            getCurrentPrice(address),
            isTokenListed(address),
            getCurveProgress(address),
        ]);
        // Try to get more info from subgraph
        let subgraphToken = null;
        try {
            subgraphToken = await fetchTokenInfo(address);
        }
        catch {
            // Subgraph not available, continue with on-chain data only
        }
        spinner.succeed('Token info loaded');
        printSection(`${tokenInfo.symbol} - ${tokenInfo.name}`);
        printKeyValue('Address', styled.secondary(address));
        printKeyValue('Symbol', styled.bold(tokenInfo.symbol));
        printKeyValue('Name', tokenInfo.name);
        printKeyValue('Decimals', tokenInfo.decimals.toString());
        printKeyValue('Total Supply', formatNumber(Number(formatEther(tokenInfo.totalSupply))));
        newLine();
        printKeyValue('Listed on Curve', listed ? styled.success('Yes') : styled.error('No'));
        printKeyValue('Current Price', formatPrice(Number(price) / 1e8));
        printKeyValue('Curve Progress', progressBar(progress));
        if (subgraphToken) {
            newLine();
            printKeyValue('Total Volume', formatNumber(parseFloat(subgraphToken.totalVolume)) + ' MNT');
            printKeyValue('Total Trades', subgraphToken.totalTrades.toString());
            printKeyValue('Creator', formatAddress(subgraphToken.creator));
            printKeyValue('Created', formatTimeAgo(subgraphToken.createdAt));
            if (subgraphToken.website) {
                printKeyValue('Website', styled.secondary(subgraphToken.website));
            }
            if (subgraphToken.twitter) {
                printKeyValue('Twitter', styled.secondary(subgraphToken.twitter));
            }
            if (subgraphToken.telegram) {
                printKeyValue('Telegram', styled.secondary(subgraphToken.telegram));
            }
        }
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
export default tokensCommand;
//# sourceMappingURL=tokens.js.map