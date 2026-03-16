import { Command } from 'commander';
import { printSuccess, printError, printSection, printKeyValue, printWarning, createSpinner, styled, formatAddress, newLine, } from '../lib/ui.js';
import { generateNewWallet, walletFromMnemonic, accountFromPrivateKey, saveWallet, loadPrivateKey, getWalletAddress, isWalletConfigured, paths, } from '../lib/wallet.js';
import { promptSelect, promptNewPassword, promptPassword, promptConfirm, promptPrivateKey, promptMnemonic, } from '../lib/prompts.js';
import { getNativeBalance, formatEther } from '../lib/client.js';
export const walletCommand = new Command('wallet')
    .description('Wallet management commands');
// Setup wallet
walletCommand
    .command('setup')
    .description('Set up a new wallet or import an existing one')
    .action(async () => {
    try {
        if (isWalletConfigured()) {
            const overwrite = await promptConfirm('A wallet is already configured. Do you want to replace it?', false);
            if (!overwrite) {
                printWarning('Wallet setup cancelled');
                return;
            }
        }
        const method = await promptSelect('How would you like to set up your wallet?', [
            { name: 'Generate new wallet', value: 'generate', description: 'Create a fresh wallet with new mnemonic' },
            { name: 'Import private key', value: 'privateKey', description: 'Import using a 64-character hex key' },
            { name: 'Import mnemonic', value: 'mnemonic', description: 'Import using 12 or 24 word seed phrase' },
        ]);
        let privateKey;
        let address;
        let mnemonic;
        if (method === 'generate') {
            const wallet = generateNewWallet();
            privateKey = wallet.privateKey;
            address = wallet.address;
            mnemonic = wallet.mnemonic;
            newLine();
            printWarning('IMPORTANT: Save your recovery phrase in a secure location!');
            printWarning('This is the ONLY way to recover your wallet.');
            newLine();
            console.log(styled.warning('Recovery Phrase:'));
            console.log(styled.bold(mnemonic));
            newLine();
            const confirmed = await promptConfirm('I have saved my recovery phrase', false);
            if (!confirmed) {
                printError('Please save your recovery phrase before continuing');
                return;
            }
        }
        else if (method === 'privateKey') {
            const key = await promptPrivateKey();
            const wallet = accountFromPrivateKey(key);
            privateKey = wallet.privateKey;
            address = wallet.address;
        }
        else {
            const phrase = await promptMnemonic();
            const wallet = walletFromMnemonic(phrase);
            privateKey = wallet.privateKey;
            address = wallet.address;
        }
        // Set password
        const password = await promptNewPassword();
        // Save wallet
        const spinner = createSpinner('Encrypting and saving wallet...').start();
        saveWallet(privateKey, password);
        spinner.succeed('Wallet saved');
        newLine();
        printSuccess('Wallet configured successfully!');
        printKeyValue('Address', styled.secondary(address));
        printKeyValue('Keystore', styled.muted(paths.keystore));
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// Show wallet address
walletCommand
    .command('show')
    .description('Display your wallet address')
    .action(async () => {
    try {
        const address = getWalletAddress();
        if (!address) {
            printError('No wallet configured', 'Run "pike wallet setup" to create one');
            process.exit(1);
        }
        printSection('Wallet');
        printKeyValue('Address', styled.secondary(address));
        printKeyValue('Keystore', styled.muted(paths.keystore));
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// Show wallet balance
walletCommand
    .command('balance')
    .description('Show wallet balances')
    .action(async () => {
    try {
        const address = getWalletAddress();
        if (!address) {
            printError('No wallet configured', 'Run "pike wallet setup" to create one');
            process.exit(1);
        }
        const spinner = createSpinner('Fetching balances...').start();
        const nativeBalance = await getNativeBalance(address);
        spinner.succeed('Balances fetched');
        printSection('Wallet Balance');
        printKeyValue('Address', styled.secondary(formatAddress(address)));
        printKeyValue('MNT', styled.primary(formatEther(nativeBalance)));
        // TODO: Fetch token balances from subgraph
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
// Export private key
walletCommand
    .command('export')
    .description('Export your private key (use with caution)')
    .action(async () => {
    try {
        if (!isWalletConfigured()) {
            printError('No wallet configured', 'Run "pike wallet setup" to create one');
            process.exit(1);
        }
        printWarning('WARNING: Your private key controls all funds in your wallet.');
        printWarning('Never share it with anyone or paste it on untrusted websites.');
        newLine();
        const confirmed = await promptConfirm('I understand the risks and want to export my private key', false);
        if (!confirmed) {
            printWarning('Export cancelled');
            return;
        }
        const password = await promptPassword('Enter your wallet password');
        const spinner = createSpinner('Decrypting...').start();
        const privateKey = loadPrivateKey(password);
        spinner.stop();
        newLine();
        console.log(styled.warning('Private Key:'));
        console.log(styled.muted(privateKey));
        newLine();
        printWarning('Make sure to clear your terminal history after copying');
    }
    catch (error) {
        printError(error.message);
        process.exit(1);
    }
});
export default walletCommand;
//# sourceMappingURL=wallet.js.map