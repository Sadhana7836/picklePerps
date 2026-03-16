import blessed from 'blessed';
import { colors } from '../lib/theme.js';
import { generateNewWallet, walletFromMnemonic, accountFromPrivateKey, saveWallet, } from '../lib/wallet.js';
import { getBuyQuote, getSellQuote, buyTokens, sellTokens, openPosition } from '../lib/contracts.js';
// Base dialog class
export function createDialog(screen, title, width = '60%', height = '60%') {
    const dialog = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width,
        height,
        label: ` ${title} `,
        tags: true,
        border: { type: 'line' },
        style: {
            fg: colors.text,
            bg: colors.bgPanel,
            border: { fg: colors.primary },
            label: { fg: colors.primary, bold: true },
        },
        keys: true,
        vi: true,
        mouse: true,
        shadow: true,
    });
    return dialog;
}
// Password input dialog
export async function promptPassword(screen, message = 'Enter wallet password') {
    return new Promise((resolve) => {
        const dialog = createDialog(screen, 'Password Required', '50%', 10);
        const label = blessed.text({
            parent: dialog,
            top: 1,
            left: 2,
            content: message,
            style: { fg: colors.text },
        });
        const input = blessed.textbox({
            parent: dialog,
            top: 3,
            left: 2,
            width: '90%',
            height: 3,
            border: { type: 'line' },
            style: {
                fg: colors.text,
                bg: colors.bgLight,
                border: { fg: colors.border },
                focus: { border: { fg: colors.primary } },
            },
            censor: true,
            inputOnFocus: true,
        });
        const hint = blessed.text({
            parent: dialog,
            bottom: 1,
            left: 2,
            content: '{green-fg}[Enter]{/} Confirm  {red-fg}[Escape]{/} Cancel',
            tags: true,
            style: { fg: colors.textMuted },
        });
        input.on('submit', (value) => {
            dialog.destroy();
            screen.render();
            resolve(value);
        });
        input.on('cancel', () => {
            dialog.destroy();
            screen.render();
            resolve(null);
        });
        input.key(['escape'], () => {
            dialog.destroy();
            screen.render();
            resolve(null);
        });
        input.focus();
        screen.render();
    });
}
// Confirmation dialog
export async function promptConfirm(screen, message) {
    return new Promise((resolve) => {
        const dialog = createDialog(screen, 'Confirm', '50%', 10);
        const text = blessed.text({
            parent: dialog,
            top: 2,
            left: 'center',
            content: message,
            style: { fg: colors.text },
        });
        const hint = blessed.text({
            parent: dialog,
            bottom: 1,
            left: 2,
            content: '{green-fg}[Y]{/} Yes  {red-fg}[N/Escape]{/} No',
            tags: true,
            style: { fg: colors.textMuted },
        });
        dialog.key(['y', 'Y', 'enter'], () => {
            dialog.destroy();
            screen.render();
            resolve(true);
        });
        dialog.key(['n', 'N', 'escape'], () => {
            dialog.destroy();
            screen.render();
            resolve(false);
        });
        dialog.focus();
        screen.render();
    });
}
// Amount input dialog
export async function promptAmount(screen, title, hint = 'Enter amount') {
    return new Promise((resolve) => {
        const dialog = createDialog(screen, title, '50%', 12);
        const label = blessed.text({
            parent: dialog,
            top: 1,
            left: 2,
            content: hint,
            style: { fg: colors.text },
        });
        const input = blessed.textbox({
            parent: dialog,
            top: 3,
            left: 2,
            width: '90%',
            height: 3,
            border: { type: 'line' },
            style: {
                fg: colors.text,
                bg: colors.bgLight,
                border: { fg: colors.border },
                focus: { border: { fg: colors.primary } },
            },
            inputOnFocus: true,
        });
        const hintText = blessed.text({
            parent: dialog,
            bottom: 1,
            left: 2,
            content: '{green-fg}[Enter]{/} Confirm  {red-fg}[Escape]{/} Cancel',
            tags: true,
            style: { fg: colors.textMuted },
        });
        input.on('submit', (value) => {
            const num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                label.setContent('{red-fg}Invalid amount! Enter a positive number.{/red-fg}');
                screen.render();
                return;
            }
            dialog.destroy();
            screen.render();
            resolve(value);
        });
        input.on('cancel', () => {
            dialog.destroy();
            screen.render();
            resolve(null);
        });
        input.key(['escape'], () => {
            dialog.destroy();
            screen.render();
            resolve(null);
        });
        input.focus();
        screen.render();
    });
}
// Buy token dialog
export async function showBuyDialog(screen, token, onComplete) {
    const dialog = createDialog(screen, `Buy ${token.symbol}`, '60%', '50%');
    const price = parseFloat(token.currentPrice) / 1e8;
    let content = blessed.box({
        parent: dialog,
        top: 1,
        left: 2,
        width: '95%',
        height: '70%',
        tags: true,
        style: { fg: colors.text },
    });
    content.setContent(`
  {bold}Token:{/bold} {green-fg}${token.symbol}{/green-fg} - ${token.name}
  {bold}Current Price:{/bold} $${price.toFixed(8)}

  {bold}Amount (MNT):{/bold}
  `);
    const input = blessed.textbox({
        parent: dialog,
        top: 7,
        left: 2,
        width: '40%',
        height: 3,
        border: { type: 'line' },
        style: {
            fg: colors.text,
            bg: colors.bgLight,
            border: { fg: colors.border },
            focus: { border: { fg: colors.primary } },
        },
        inputOnFocus: true,
    });
    const quoteBox = blessed.box({
        parent: dialog,
        top: 11,
        left: 2,
        width: '95%',
        height: 6,
        tags: true,
        style: { fg: colors.textMuted },
        content: '{gray-fg}Enter an amount to see quote{/gray-fg}',
    });
    const hint = blessed.text({
        parent: dialog,
        bottom: 1,
        left: 2,
        content: '{green-fg}[Enter]{/} Get Quote & Buy  {red-fg}[Escape]{/} Cancel',
        tags: true,
        style: { fg: colors.textMuted },
    });
    input.on('submit', async (value) => {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
            quoteBox.setContent('{red-fg}Invalid amount!{/red-fg}');
            screen.render();
            input.focus();
            return;
        }
        quoteBox.setContent('{yellow-fg}Fetching quote...{/yellow-fg}');
        screen.render();
        try {
            const quote = await getBuyQuote(token.address, value);
            const tokensOut = Number(quote.tokensOut) / 1e18;
            const avgPrice = Number(quote.avgPrice) / 1e8;
            const fee = Number(quote.fee) / 1e18;
            quoteBox.setContent(`
  {bold}You will receive:{/bold} {green-fg}${tokensOut.toFixed(4)} ${token.symbol}{/green-fg}
  {bold}Average Price:{/bold} $${avgPrice.toFixed(8)}
  {bold}Fee:{/bold} ${fee.toFixed(6)} MNT
  {bold}Price Impact:{/bold} ${quote.priceImpact.toFixed(2)}%

  {green-fg}[C]{/} Confirm Trade  {red-fg}[Escape]{/} Cancel
      `);
            screen.render();
            // Wait for confirmation
            dialog.key(['c', 'C'], async () => {
                // Get password
                dialog.destroy();
                const password = await promptPassword(screen, 'Enter wallet password to confirm trade');
                if (!password) {
                    onComplete(false, 'Trade cancelled');
                    return;
                }
                // Execute trade
                const loadingBox = createDialog(screen, 'Processing', '40%', 6);
                loadingBox.setContent('\n  {yellow-fg}Executing trade...{/yellow-fg}');
                screen.render();
                try {
                    const minTokens = quote.tokensOut - (quote.tokensOut * 100n / 10000n); // 1% slippage
                    const result = await buyTokens(token.address, value, minTokens, password);
                    loadingBox.destroy();
                    screen.render();
                    onComplete(true, `Successfully bought ${(Number(result.tokensReceived) / 1e18).toFixed(4)} ${token.symbol}!\nTx: ${result.hash.slice(0, 20)}...`);
                }
                catch (error) {
                    loadingBox.destroy();
                    screen.render();
                    onComplete(false, `Trade failed: ${error.message}`);
                }
            });
        }
        catch (error) {
            quoteBox.setContent(`{red-fg}Error: ${error.message}{/red-fg}`);
            screen.render();
        }
    });
    input.key(['escape'], () => {
        dialog.destroy();
        screen.render();
        onComplete(false, 'Cancelled');
    });
    dialog.key(['escape'], () => {
        dialog.destroy();
        screen.render();
        onComplete(false, 'Cancelled');
    });
    input.focus();
    screen.render();
}
// Sell token dialog
export async function showSellDialog(screen, token, onComplete) {
    const dialog = createDialog(screen, `Sell ${token.symbol}`, '60%', '50%');
    const price = parseFloat(token.currentPrice) / 1e8;
    let content = blessed.box({
        parent: dialog,
        top: 1,
        left: 2,
        width: '95%',
        height: '70%',
        tags: true,
        style: { fg: colors.text },
    });
    content.setContent(`
  {bold}Token:{/bold} {green-fg}${token.symbol}{/green-fg} - ${token.name}
  {bold}Current Price:{/bold} $${price.toFixed(8)}

  {bold}Amount (${token.symbol}):{/bold}
  `);
    const input = blessed.textbox({
        parent: dialog,
        top: 7,
        left: 2,
        width: '40%',
        height: 3,
        border: { type: 'line' },
        style: {
            fg: colors.text,
            bg: colors.bgLight,
            border: { fg: colors.border },
            focus: { border: { fg: colors.primary } },
        },
        inputOnFocus: true,
    });
    const quoteBox = blessed.box({
        parent: dialog,
        top: 11,
        left: 2,
        width: '95%',
        height: 6,
        tags: true,
        style: { fg: colors.textMuted },
        content: '{gray-fg}Enter an amount to see quote{/gray-fg}',
    });
    const hint = blessed.text({
        parent: dialog,
        bottom: 1,
        left: 2,
        content: '{green-fg}[Enter]{/} Get Quote & Sell  {red-fg}[Escape]{/} Cancel',
        tags: true,
        style: { fg: colors.textMuted },
    });
    input.on('submit', async (value) => {
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
            quoteBox.setContent('{red-fg}Invalid amount!{/red-fg}');
            screen.render();
            input.focus();
            return;
        }
        quoteBox.setContent('{yellow-fg}Fetching quote...{/yellow-fg}');
        screen.render();
        try {
            const quote = await getSellQuote(token.address, value);
            const ethOut = Number(quote.ethOut) / 1e18;
            const avgPrice = Number(quote.avgPrice) / 1e8;
            const fee = Number(quote.fee) / 1e18;
            quoteBox.setContent(`
  {bold}You will receive:{/bold} {green-fg}${ethOut.toFixed(6)} MNT{/green-fg}
  {bold}Average Price:{/bold} $${avgPrice.toFixed(8)}
  {bold}Fee:{/bold} ${fee.toFixed(6)} MNT
  {bold}Price Impact:{/bold} ${quote.priceImpact.toFixed(2)}%

  {green-fg}[C]{/} Confirm Trade  {red-fg}[Escape]{/} Cancel
      `);
            screen.render();
            dialog.key(['c', 'C'], async () => {
                dialog.destroy();
                const password = await promptPassword(screen, 'Enter wallet password to confirm trade');
                if (!password) {
                    onComplete(false, 'Trade cancelled');
                    return;
                }
                const loadingBox = createDialog(screen, 'Processing', '40%', 6);
                loadingBox.setContent('\n  {yellow-fg}Executing trade...{/yellow-fg}');
                screen.render();
                try {
                    const minEth = quote.ethOut - (quote.ethOut * 100n / 10000n); // 1% slippage
                    const result = await sellTokens(token.address, value, minEth, password);
                    loadingBox.destroy();
                    screen.render();
                    onComplete(true, `Successfully sold ${value} ${token.symbol} for ${(Number(result.ethReceived) / 1e18).toFixed(6)} MNT!\nTx: ${result.hash.slice(0, 20)}...`);
                }
                catch (error) {
                    loadingBox.destroy();
                    screen.render();
                    onComplete(false, `Trade failed: ${error.message}`);
                }
            });
        }
        catch (error) {
            quoteBox.setContent(`{red-fg}Error: ${error.message}{/red-fg}`);
            screen.render();
        }
    });
    input.key(['escape'], () => {
        dialog.destroy();
        screen.render();
        onComplete(false, 'Cancelled');
    });
    dialog.key(['escape'], () => {
        dialog.destroy();
        screen.render();
        onComplete(false, 'Cancelled');
    });
    input.focus();
    screen.render();
}
// Open position dialog
export async function showOpenPositionDialog(screen, token, isLong, onComplete) {
    const dialog = createDialog(screen, `${isLong ? 'Long' : 'Short'} ${token.symbol}`, '60%', '60%');
    const price = parseFloat(token.currentPrice) / 1e8;
    const side = isLong ? '{green-fg}LONG{/green-fg}' : '{red-fg}SHORT{/red-fg}';
    const content = blessed.box({
        parent: dialog,
        top: 1,
        left: 2,
        width: '95%',
        height: 8,
        tags: true,
        style: { fg: colors.text },
        content: `
  {bold}Token:{/bold} {green-fg}${token.symbol}{/green-fg} - ${token.name}
  {bold}Side:{/bold} ${side}
  {bold}Current Price:{/bold} $${price.toFixed(8)}

  {bold}Margin (MNT):{/bold}
    `,
    });
    const marginInput = blessed.textbox({
        parent: dialog,
        top: 9,
        left: 2,
        width: '30%',
        height: 3,
        border: { type: 'line' },
        style: {
            fg: colors.text,
            bg: colors.bgLight,
            border: { fg: colors.border },
            focus: { border: { fg: colors.primary } },
        },
        inputOnFocus: true,
    });
    const leverageLabel = blessed.text({
        parent: dialog,
        top: 10,
        left: '35%',
        content: '{bold}Leverage:{/bold}',
        tags: true,
        style: { fg: colors.text },
    });
    const leverageInput = blessed.textbox({
        parent: dialog,
        top: 9,
        left: '50%',
        width: '20%',
        height: 3,
        border: { type: 'line' },
        style: {
            fg: colors.text,
            bg: colors.bgLight,
            border: { fg: colors.border },
            focus: { border: { fg: colors.primary } },
        },
        inputOnFocus: true,
    });
    leverageInput.setValue('10');
    const positionInfo = blessed.box({
        parent: dialog,
        top: 13,
        left: 2,
        width: '95%',
        height: 6,
        tags: true,
        style: { fg: colors.textMuted },
        content: '{gray-fg}Enter margin and leverage to see position details{/gray-fg}',
    });
    const hint = blessed.text({
        parent: dialog,
        bottom: 1,
        left: 2,
        content: '{green-fg}[Tab]{/} Switch fields  {green-fg}[Enter]{/} Open Position  {red-fg}[Escape]{/} Cancel',
        tags: true,
        style: { fg: colors.textMuted },
    });
    const updatePositionInfo = () => {
        const margin = parseFloat(marginInput.getValue()) || 0;
        const leverage = parseInt(leverageInput.getValue()) || 10;
        if (margin > 0) {
            const size = margin * leverage;
            const liqPrice = isLong
                ? price * (1 - 0.9 / leverage)
                : price * (1 + 0.9 / leverage);
            positionInfo.setContent(`
  {bold}Position Size:{/bold} ${size.toFixed(2)} MNT
  {bold}Leverage:{/bold} ${leverage}x
  {bold}Est. Liquidation:{/bold} {yellow-fg}$${liqPrice.toFixed(8)}{/yellow-fg}
      `);
        }
        screen.render();
    };
    marginInput.on('keypress', () => setTimeout(updatePositionInfo, 50));
    leverageInput.on('keypress', () => setTimeout(updatePositionInfo, 50));
    marginInput.key(['tab'], () => {
        leverageInput.focus();
    });
    leverageInput.key(['tab'], () => {
        marginInput.focus();
    });
    const submitPosition = async () => {
        const margin = marginInput.getValue();
        const leverage = parseInt(leverageInput.getValue());
        if (!margin || parseFloat(margin) <= 0) {
            positionInfo.setContent('{red-fg}Invalid margin amount!{/red-fg}');
            screen.render();
            return;
        }
        if (isNaN(leverage) || leverage < 1 || leverage > 100) {
            positionInfo.setContent('{red-fg}Leverage must be between 1 and 100!{/red-fg}');
            screen.render();
            return;
        }
        dialog.destroy();
        const password = await promptPassword(screen, 'Enter wallet password to confirm');
        if (!password) {
            onComplete(false, 'Position cancelled');
            return;
        }
        const loadingBox = createDialog(screen, 'Processing', '40%', 6);
        loadingBox.setContent('\n  {yellow-fg}Opening position...{/yellow-fg}');
        screen.render();
        try {
            const result = await openPosition(token.address, isLong, margin, leverage, password);
            loadingBox.destroy();
            screen.render();
            onComplete(true, `Position opened! ID: ${result.positionId}\nTx: ${result.hash.slice(0, 20)}...`);
        }
        catch (error) {
            loadingBox.destroy();
            screen.render();
            onComplete(false, `Failed: ${error.message}`);
        }
    };
    marginInput.on('submit', submitPosition);
    leverageInput.on('submit', submitPosition);
    dialog.key(['escape'], () => {
        dialog.destroy();
        screen.render();
        onComplete(false, 'Cancelled');
    });
    marginInput.focus();
    screen.render();
}
// Wallet setup dialog
export async function showWalletSetupDialog(screen, onComplete) {
    const dialog = createDialog(screen, 'Wallet Setup', '70%', '70%');
    const content = blessed.box({
        parent: dialog,
        top: 1,
        left: 2,
        width: '95%',
        height: '80%',
        tags: true,
        style: { fg: colors.text },
        content: `
  {bold}How would you like to set up your wallet?{/bold}

  {green-fg}[G]{/} Generate new wallet
     Create a fresh wallet with a new mnemonic phrase

  {green-fg}[I]{/} Import private key
     Import using a 64-character hex private key

  {green-fg}[M]{/} Import mnemonic
     Import using a 12 or 24 word seed phrase

  {red-fg}[Escape]{/} Cancel
    `,
    });
    dialog.key(['g', 'G'], async () => {
        dialog.destroy();
        // Generate new wallet
        const wallet = generateNewWallet();
        // Show mnemonic
        const mnemonicDialog = createDialog(screen, 'Save Your Recovery Phrase', '80%', '60%');
        mnemonicDialog.setContent(`
  {bold}{yellow-fg}IMPORTANT: Save your recovery phrase!{/yellow-fg}{/bold}

  This is the ONLY way to recover your wallet. Write it down and
  store it in a safe place. Never share it with anyone.

  {bold}Recovery Phrase:{/bold}

  {green-fg}${wallet.mnemonic}{/green-fg}

  {bold}Address:{/bold} ${wallet.address}

  {green-fg}[C]{/} I have saved my recovery phrase, continue
  {red-fg}[Escape]{/} Cancel
    `);
        screen.render();
        mnemonicDialog.key(['c', 'C'], async () => {
            mnemonicDialog.destroy();
            // Set password
            const password = await promptNewPassword(screen);
            if (!password) {
                onComplete(false, 'Setup cancelled');
                return;
            }
            try {
                saveWallet(wallet.privateKey, password);
                onComplete(true, `Wallet created!\nAddress: ${wallet.address}`);
            }
            catch (error) {
                onComplete(false, `Failed: ${error.message}`);
            }
        });
        mnemonicDialog.key(['escape'], () => {
            mnemonicDialog.destroy();
            screen.render();
            onComplete(false, 'Cancelled');
        });
    });
    dialog.key(['i', 'I'], async () => {
        dialog.destroy();
        const keyDialog = createDialog(screen, 'Import Private Key', '70%', 12);
        const keyLabel = blessed.text({
            parent: keyDialog,
            top: 1,
            left: 2,
            content: 'Enter your private key (64 hex characters):',
            style: { fg: colors.text },
        });
        const keyInput = blessed.textbox({
            parent: keyDialog,
            top: 3,
            left: 2,
            width: '95%',
            height: 3,
            border: { type: 'line' },
            style: {
                fg: colors.text,
                bg: colors.bgLight,
                border: { fg: colors.border },
                focus: { border: { fg: colors.primary } },
            },
            censor: true,
            inputOnFocus: true,
        });
        keyInput.on('submit', async (value) => {
            try {
                const wallet = accountFromPrivateKey(value);
                keyDialog.destroy();
                const password = await promptNewPassword(screen);
                if (!password) {
                    onComplete(false, 'Setup cancelled');
                    return;
                }
                saveWallet(wallet.privateKey, password);
                onComplete(true, `Wallet imported!\nAddress: ${wallet.address}`);
            }
            catch (error) {
                keyDialog.setContent(`\n  {red-fg}Invalid private key: ${error.message}{/red-fg}`);
                screen.render();
            }
        });
        keyInput.key(['escape'], () => {
            keyDialog.destroy();
            screen.render();
            onComplete(false, 'Cancelled');
        });
        keyInput.focus();
        screen.render();
    });
    dialog.key(['m', 'M'], async () => {
        dialog.destroy();
        const mnemonicDialog = createDialog(screen, 'Import Mnemonic', '70%', 12);
        const mnemonicLabel = blessed.text({
            parent: mnemonicDialog,
            top: 1,
            left: 2,
            content: 'Enter your mnemonic phrase (12 or 24 words):',
            style: { fg: colors.text },
        });
        const mnemonicInput = blessed.textbox({
            parent: mnemonicDialog,
            top: 3,
            left: 2,
            width: '95%',
            height: 3,
            border: { type: 'line' },
            style: {
                fg: colors.text,
                bg: colors.bgLight,
                border: { fg: colors.border },
                focus: { border: { fg: colors.primary } },
            },
            censor: true,
            inputOnFocus: true,
        });
        mnemonicInput.on('submit', async (value) => {
            try {
                const wallet = walletFromMnemonic(value.trim());
                mnemonicDialog.destroy();
                const password = await promptNewPassword(screen);
                if (!password) {
                    onComplete(false, 'Setup cancelled');
                    return;
                }
                saveWallet(wallet.privateKey, password);
                onComplete(true, `Wallet imported!\nAddress: ${wallet.address}`);
            }
            catch (error) {
                mnemonicDialog.setContent(`\n  {red-fg}Invalid mnemonic: ${error.message}{/red-fg}`);
                screen.render();
            }
        });
        mnemonicInput.key(['escape'], () => {
            mnemonicDialog.destroy();
            screen.render();
            onComplete(false, 'Cancelled');
        });
        mnemonicInput.focus();
        screen.render();
    });
    dialog.key(['escape'], () => {
        dialog.destroy();
        screen.render();
        onComplete(false, 'Cancelled');
    });
    dialog.focus();
    screen.render();
}
// Set new password dialog
async function promptNewPassword(screen) {
    return new Promise((resolve) => {
        const dialog = createDialog(screen, 'Set Password', '50%', 14);
        const label1 = blessed.text({
            parent: dialog,
            top: 1,
            left: 2,
            content: 'Set a password (min 6 characters):',
            style: { fg: colors.text },
        });
        const input1 = blessed.textbox({
            parent: dialog,
            top: 3,
            left: 2,
            width: '90%',
            height: 3,
            border: { type: 'line' },
            style: {
                fg: colors.text,
                bg: colors.bgLight,
                border: { fg: colors.border },
                focus: { border: { fg: colors.primary } },
            },
            censor: true,
            inputOnFocus: true,
        });
        const label2 = blessed.text({
            parent: dialog,
            top: 6,
            left: 2,
            content: 'Confirm password:',
            style: { fg: colors.text },
        });
        const input2 = blessed.textbox({
            parent: dialog,
            top: 8,
            left: 2,
            width: '90%',
            height: 3,
            border: { type: 'line' },
            style: {
                fg: colors.text,
                bg: colors.bgLight,
                border: { fg: colors.border },
                focus: { border: { fg: colors.primary } },
            },
            censor: true,
            inputOnFocus: true,
        });
        const errorText = blessed.text({
            parent: dialog,
            bottom: 2,
            left: 2,
            content: '',
            tags: true,
            style: { fg: 'red' },
        });
        input1.key(['tab', 'enter'], () => input2.focus());
        input2.key(['S-tab'], () => input1.focus());
        input2.on('submit', () => {
            const pass1 = input1.getValue();
            const pass2 = input2.getValue();
            if (pass1.length < 6) {
                errorText.setContent('{red-fg}Password must be at least 6 characters{/red-fg}');
                screen.render();
                return;
            }
            if (pass1 !== pass2) {
                errorText.setContent('{red-fg}Passwords do not match{/red-fg}');
                screen.render();
                return;
            }
            dialog.destroy();
            screen.render();
            resolve(pass1);
        });
        dialog.key(['escape'], () => {
            dialog.destroy();
            screen.render();
            resolve(null);
        });
        input1.focus();
        screen.render();
    });
}
// Message/notification dialog
export function showNotification(screen, title, message, type = 'info') {
    const colorMap = {
        success: colors.success,
        error: colors.error,
        info: colors.primary,
    };
    const dialog = blessed.message({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '50%',
        height: 'shrink',
        label: ` ${title} `,
        tags: true,
        border: { type: 'line' },
        style: {
            fg: colors.text,
            bg: colors.bgPanel,
            border: { fg: colorMap[type] },
            label: { fg: colorMap[type], bold: true },
        },
        shadow: true,
    });
    dialog.display(message, 3, () => {
        screen.render();
    });
    screen.render();
}
//# sourceMappingURL=Dialogs.js.map