import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { formatAddress, formatPrice, formatNumber, formatTimeAgo } from '../lib/theme.js';
import { getWalletAddress, isWalletConfigured, loadPrivateKey, saveWallet, generateNewWallet, walletFromMnemonic, accountFromPrivateKey } from '../lib/wallet.js';
import { getNativeBalance, formatEther, getTokenInfo, getTokenBalance } from '../lib/client.js';
import { fetchTokens, fetchTrendingTokens, searchTokens } from '../lib/subgraph.js';
import { getAllUserPositions, getBuyQuote, getSellQuote, buyTokens, sellTokens, openPosition, closePosition, getCurrentPrice, getPositionPnL } from '../lib/contracts.js';
import type { Token, Position, ViewType, AppState } from '../types.js';

// ASCII logo for header
const HEADER_LOGO = `{green-fg}{bold}██████╗ ██╗██╗  ██╗███████╗  ██████╗ ███████╗██████╗ ██████╗ ███████╗
██╔══██╗██║██║ ██╔╝██╔════╝  ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝
██████╔╝██║█████╔╝ █████╗    ██████╔╝█████╗  ██████╔╝██████╔╝███████╗
██╔═══╝ ██║██╔═██╗ ██╔══╝    ██╔═══╝ ██╔══╝  ██╔══██╗██╔═══╝ ╚════██║
██║     ██║██║  ██╗███████╗  ██║     ███████╗██║  ██║██║     ███████║
╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝{/bold}{/green-fg}`;

export class App {
  private screen: blessed.Widgets.Screen;
  private state: AppState;

  // UI Components
  private header!: blessed.Widgets.BoxElement;
  private sidebar!: blessed.Widgets.ListElement;
  private mainContent!: blessed.Widgets.BoxElement;
  private tokenList!: blessed.Widgets.ListElement;
  private detailsPanel!: blessed.Widgets.BoxElement;
  private actionsPanel!: blessed.Widgets.BoxElement;
  private statusBar!: blessed.Widgets.BoxElement;
  private loadingBox!: blessed.Widgets.BoxElement;

  private selectedTokenIndex: number = 0;
  private selectedPositionIndex: number = 0;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Pickle Perps TUI',
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: 'green',
      },
    });

    this.state = {
      currentView: 'dashboard',
      selectedToken: null,
      selectedRWA: null,
      walletAddress: getWalletAddress(),
      walletBalance: '0',
      isLoading: false,
      error: null,
      tokens: [],
      positions: [],
      holdings: [],
    };

    this.initializeUI();
    this.setupKeyBindings();
    this.loadInitialData();
  }

  private initializeUI(): void {
    // Header with ASCII art logo
    this.header = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 8,
      tags: true,
      content: HEADER_LOGO + '\n{center}{gray-fg}Trade Meme Tokens & RWA on Stellar{/gray-fg}{/center}',
      style: {
        fg: 'white',
      },
    });

    // Sidebar Navigation
    this.sidebar = blessed.list({
      parent: this.screen,
      top: 8,
      left: 0,
      width: 20,
      height: '100%-11',
      label: ' {green-fg}Menu{/green-fg} ',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        border: { fg: 'green' },
        selected: { fg: 'black', bg: 'green', bold: true },
        item: { fg: 'white' },
      } as any,
      keys: true,
      mouse: true,
      items: [
        ' {green-fg}1{/green-fg} Dashboard',
        ' {green-fg}2{/green-fg} Trade',
        ' {green-fg}3{/green-fg} Positions',
        ' {green-fg}4{/green-fg} Portfolio',
        ' {green-fg}5{/green-fg} Wallet',
      ],
    });

    // Main content area
    this.mainContent = blessed.box({
      parent: this.screen,
      top: 8,
      left: 20,
      width: '100%-20',
      height: '100%-11',
      tags: true,
    });

    // Token/Position list (left side of main content)
    this.tokenList = blessed.list({
      parent: this.mainContent,
      top: 0,
      left: 0,
      width: '50%',
      height: '70%',
      label: ' {green-fg}Tokens{/green-fg} ',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        border: { fg: 'green' },
        selected: { fg: 'black', bg: 'green', bold: true },
      } as any,
      keys: true,
      mouse: true,
      items: ['{gray-fg}Loading...{/gray-fg}'],
    });

    // Details panel (right side)
    this.detailsPanel = blessed.box({
      parent: this.mainContent,
      top: 0,
      left: '50%',
      width: '50%',
      height: '70%',
      label: ' {green-fg}Details{/green-fg} ',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        border: { fg: 'green' },
      },
      content: '{center}{gray-fg}Select a token{/gray-fg}{/center}',
    });

    // Actions panel (bottom)
    this.actionsPanel = blessed.box({
      parent: this.mainContent,
      top: '70%',
      left: 0,
      width: '100%',
      height: '30%',
      label: ' {green-fg}Actions{/green-fg} ',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        border: { fg: 'green' },
      },
      content: this.getActionsContent(),
    });

    // Status bar
    this.statusBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 3,
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        border: { fg: 'gray' },
      },
    });

    // Loading overlay (hidden)
    this.loadingBox = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 40,
      height: 5,
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'black',
        border: { fg: 'green' },
      },
      content: '{center}\n{yellow-fg}Loading...{/yellow-fg}{/center}',
      hidden: true,
    });

    this.updateStatusBar();
  }

  private getActionsContent(): string {
    if (this.state.currentView === 'dashboard' || this.state.currentView === 'trade') {
      return `
 {green-fg}[B]{/green-fg} Buy Token    {red-fg}[S]{/red-fg} Sell Token    {green-fg}[L]{/green-fg} Long Position    {red-fg}[H]{/red-fg} Short Position

 {green-fg}[R]{/green-fg} Refresh    {green-fg}[/]{/green-fg} Search    {green-fg}[Enter]{/green-fg} Select    {red-fg}[Q]{/red-fg} Quit`;
    } else if (this.state.currentView === 'positions') {
      return `
 {red-fg}[C]{/red-fg} Close Position    {green-fg}[R]{/green-fg} Refresh    {green-fg}[Enter]{/green-fg} View Details

 {green-fg}[1-5]{/green-fg} Navigate Views    {red-fg}[Q]{/red-fg} Quit`;
    } else if (this.state.currentView === 'wallet') {
      return `
 {green-fg}[G]{/green-fg} Generate Wallet    {green-fg}[I]{/green-fg} Import Key    {green-fg}[M]{/green-fg} Import Mnemonic

 {green-fg}[R]{/green-fg} Refresh Balance    {red-fg}[Q]{/red-fg} Quit`;
    }
    return `\n {green-fg}[R]{/green-fg} Refresh    {green-fg}[1-5]{/green-fg} Navigate    {red-fg}[Q]{/red-fg} Quit`;
  }

  private setupKeyBindings(): void {
    // Quit
    this.screen.key(['q', 'C-c'], () => process.exit(0));

    // Navigation
    this.screen.key(['1'], () => this.switchView('dashboard'));
    this.screen.key(['2'], () => this.switchView('trade'));
    this.screen.key(['3'], () => this.switchView('positions'));
    this.screen.key(['4'], () => this.switchView('portfolio'));
    this.screen.key(['5'], () => this.switchView('wallet'));

    // Refresh
    this.screen.key(['r'], () => this.refreshData());

    // Trading actions
    this.screen.key(['b'], () => this.showBuyDialog());
    this.screen.key(['s'], () => this.showSellDialog());
    this.screen.key(['l'], () => this.showOpenPositionDialog(true));
    this.screen.key(['h'], () => this.showOpenPositionDialog(false));
    this.screen.key(['c'], () => this.showClosePositionDialog());

    // Wallet actions
    this.screen.key(['g'], () => this.generateWallet());
    this.screen.key(['i'], () => this.importPrivateKey());
    this.screen.key(['m'], () => this.importMnemonic());

    // Search
    this.screen.key(['/'], () => this.showSearchDialog());

    // Tab navigation
    this.screen.key(['tab'], () => {
      if ((this.screen as any).focused === this.tokenList) {
        this.sidebar.focus();
      } else {
        this.tokenList.focus();
      }
      this.screen.render();
    });

    // Token list selection
    this.tokenList.on('select', (item: any, index: number) => {
      this.selectedTokenIndex = index;
      if (this.state.currentView === 'positions') {
        if (this.state.positions[index]) {
          this.updatePositionDetails(this.state.positions[index]);
        }
      } else {
        if (this.state.tokens[index]) {
          this.state.selectedToken = this.state.tokens[index];
          this.updateTokenDetails();
        }
      }
    });

    this.tokenList.key(['up', 'down', 'k', 'j'], () => {
      const index = (this.tokenList as any).selected || 0;
      if (this.state.currentView === 'positions') {
        if (this.state.positions[index]) {
          this.updatePositionDetails(this.state.positions[index]);
        }
      } else {
        if (this.state.tokens[index]) {
          this.state.selectedToken = this.state.tokens[index];
          this.updateTokenDetails();
        }
      }
    });

    // Sidebar selection
    this.sidebar.on('select', (item: any, index: number) => {
      const views: ViewType[] = ['dashboard', 'trade', 'positions', 'portfolio', 'wallet'];
      this.switchView(views[index]);
    });

    this.tokenList.focus();
  }

  private switchView(view: ViewType): void {
    this.state.currentView = view;
    this.sidebar.select(['dashboard', 'trade', 'positions', 'portfolio', 'wallet'].indexOf(view));

    // Update list label and content
    if (view === 'positions') {
      this.tokenList.setLabel(' {green-fg}Positions{/green-fg} ');
      this.detailsPanel.setLabel(' {green-fg}Position Details{/green-fg} ');
      this.updatePositionsList();
    } else if (view === 'wallet') {
      this.tokenList.setLabel(' {green-fg}Wallet Info{/green-fg} ');
      this.detailsPanel.setLabel(' {green-fg}Actions{/green-fg} ');
      this.updateWalletView();
    } else if (view === 'portfolio') {
      this.tokenList.setLabel(' {green-fg}Holdings{/green-fg} ');
      this.detailsPanel.setLabel(' {green-fg}Summary{/green-fg} ');
      this.updatePortfolioView();
    } else {
      this.tokenList.setLabel(' {green-fg}Tokens{/green-fg} ');
      this.detailsPanel.setLabel(' {green-fg}Token Details{/green-fg} ');
      this.updateTokenList();
    }

    this.actionsPanel.setContent(this.getActionsContent());
    this.updateStatusBar();
    this.tokenList.focus();
    this.screen.render();
  }

  private async loadInitialData(): Promise<void> {
    this.showLoading('Loading data...');

    try {
      // Load wallet balance
      if (this.state.walletAddress) {
        const balance = await getNativeBalance(this.state.walletAddress);
        this.state.walletBalance = parseFloat(formatEther(balance)).toFixed(4);
      }

      // Load tokens
      this.state.tokens = await fetchTrendingTokens(50);
      this.updateTokenList();

      // Load positions if wallet connected
      if (this.state.walletAddress) {
        try {
          this.state.positions = await getAllUserPositions(this.state.walletAddress);
        } catch {
          this.state.positions = [];
        }
      }

      if (this.state.tokens.length > 0) {
        this.state.selectedToken = this.state.tokens[0];
        this.updateTokenDetails();
      }
    } catch (error) {
      this.state.error = (error as Error).message;
    }

    this.hideLoading();
    this.updateStatusBar();
    this.screen.render();
  }

  private async refreshData(): Promise<void> {
    this.showLoading('Refreshing...');
    await this.loadInitialData();
    this.showMessage('Data refreshed!', 'success');
  }

  private updateTokenList(): void {
    const items = this.state.tokens.map((token, i) => {
      const price = parseFloat(token.currentPrice) / 1e8;
      const priceStr = price < 0.0001 ? price.toExponential(2) : `$${price.toFixed(6)}`;
      return ` ${token.symbol.padEnd(8)} ${priceStr.padEnd(14)} ${formatNumber(parseFloat(token.totalVolume) / 1e18)} XLM`;
    });

    if (items.length === 0) {
      items.push('{gray-fg}No tokens found{/gray-fg}');
    }

    this.tokenList.setItems(items);
    this.screen.render();
  }

  private updateTokenDetails(): void {
    const token = this.state.selectedToken;
    if (!token) {
      this.detailsPanel.setContent('{center}{gray-fg}Select a token{/gray-fg}{/center}');
      return;
    }

    const price = parseFloat(token.currentPrice) / 1e8;
    const volume = parseFloat(token.totalVolume) / 1e18;

    this.detailsPanel.setContent(`
 {bold}{green-fg}${token.symbol}{/green-fg}{/bold} - ${token.name}

 {bold}Price:{/bold}      ${price < 0.0001 ? price.toExponential(4) : `$${price.toFixed(8)}`}
 {bold}Volume:{/bold}     ${volume.toFixed(4)} XLM
 {bold}Trades:{/bold}     ${token.totalTrades}
 {bold}Created:{/bold}    ${formatTimeAgo(token.createdAt)}

 {bold}Address:{/bold}
 {gray-fg}${token.address}{/gray-fg}

 {bold}Creator:{/bold}
 {gray-fg}${token.creator}{/gray-fg}
${token.website ? `\n {bold}Website:{/bold} ${token.website}` : ''}
${token.twitter ? ` {bold}Twitter:{/bold} ${token.twitter}` : ''}
    `);
    this.screen.render();
  }

  private updatePositionsList(): void {
    if (this.state.positions.length === 0) {
      this.tokenList.setItems(['{gray-fg}No open positions{/gray-fg}']);
      this.detailsPanel.setContent('{center}{gray-fg}No positions to display{/gray-fg}{/center}');
    } else {
      const items = this.state.positions.map(pos => {
        const side = pos.isLong ? '{green-fg}LONG{/green-fg}' : '{red-fg}SHORT{/red-fg}';
        const pnl = pos.pnl ? (pos.pnlIsProfit ? `{green-fg}+${pos.pnl}{/green-fg}` : `{red-fg}${pos.pnl}{/red-fg}`) : '--';
        return ` #${pos.positionId.toString().padEnd(4)} ${side.padEnd(20)} ${pos.size} XLM  ${pnl}`;
      });
      this.tokenList.setItems(items);
      if (this.state.positions[0]) {
        this.updatePositionDetails(this.state.positions[0]);
      }
    }
    this.screen.render();
  }

  private updatePositionDetails(pos: Position): void {
    const side = pos.isLong ? '{green-fg}LONG{/green-fg}' : '{red-fg}SHORT{/red-fg}';
    const pnl = pos.pnl
      ? (pos.pnlIsProfit ? `{green-fg}+${pos.pnl} XLM{/green-fg}` : `{red-fg}${pos.pnl} XLM{/red-fg}`)
      : '{gray-fg}--{/gray-fg}';

    this.detailsPanel.setContent(`
 {bold}Position #{/bold}${pos.positionId.toString()}

 {bold}Token:{/bold}      ${pos.tokenSymbol || formatAddress(pos.token)}
 {bold}Side:{/bold}       ${side}
 {bold}Size:{/bold}       ${pos.size} XLM
 {bold}Margin:{/bold}     ${pos.margin} XLM
 {bold}Leverage:{/bold}   ${pos.leverage}x
 {bold}Entry:{/bold}      $${parseFloat(pos.entryPrice).toFixed(8)}

 {bold}PnL:{/bold}        ${pnl}

 {yellow-fg}Press [C] to close this position{/yellow-fg}
    `);
    this.screen.render();
  }

  private updateWalletView(): void {
    if (!isWalletConfigured()) {
      this.tokenList.setItems([
        '{yellow-fg}No wallet configured{/yellow-fg}',
        '',
        '{green-fg}[G]{/green-fg} Generate new wallet',
        '{green-fg}[I]{/green-fg} Import private key',
        '{green-fg}[M]{/green-fg} Import mnemonic',
      ]);
      this.detailsPanel.setContent(`
 {bold}Wallet Setup{/bold}

 You need a wallet to trade on Pickle Perps.

 {bold}Options:{/bold}

 {green-fg}[G]{/green-fg} Generate a new wallet
     Creates a fresh wallet with recovery phrase

 {green-fg}[I]{/green-fg} Import private key
     Use an existing private key

 {green-fg}[M]{/green-fg} Import mnemonic
     Use a 12/24 word recovery phrase
      `);
    } else {
      this.tokenList.setItems([
        `{green-fg}Connected{/green-fg}`,
        '',
        `Address:`,
        `{gray-fg}${this.state.walletAddress}{/gray-fg}`,
        '',
        `Balance:`,
        `{green-fg}${this.state.walletBalance} XLM{/green-fg}`,
      ]);
      this.detailsPanel.setContent(`
 {bold}Wallet Connected{/bold}

 {bold}Address:{/bold}
 {green-fg}${this.state.walletAddress}{/green-fg}

 {bold}Balance:{/bold}
 {green-fg}${this.state.walletBalance} XLM{/green-fg}

 {bold}Network:{/bold}
 Stellar Testnet Testnet

 {green-fg}[R]{/green-fg} Refresh balance
      `);
    }
    this.screen.render();
  }

  private updatePortfolioView(): void {
    const items = [
      `{bold}XLM Balance:{/bold} {green-fg}${this.state.walletBalance} XLM{/green-fg}`,
      '',
      `{bold}Open Positions:{/bold} ${this.state.positions.length}`,
    ];

    this.tokenList.setItems(items);

    let totalPnl = 0;
    for (const pos of this.state.positions) {
      if (pos.pnl) {
        const pnlNum = parseFloat(pos.pnl);
        totalPnl += pos.pnlIsProfit ? pnlNum : -pnlNum;
      }
    }

    const pnlStr = totalPnl >= 0
      ? `{green-fg}+${totalPnl.toFixed(4)} XLM{/green-fg}`
      : `{red-fg}${totalPnl.toFixed(4)} XLM{/red-fg}`;

    this.detailsPanel.setContent(`
 {bold}Portfolio Summary{/bold}

 {bold}Wallet:{/bold}
 ${this.state.walletAddress ? formatAddress(this.state.walletAddress) : '{red-fg}Not connected{/red-fg}'}

 {bold}XLM Balance:{/bold}
 {green-fg}${this.state.walletBalance} XLM{/green-fg}

 {bold}Open Positions:{/bold} ${this.state.positions.length}

 {bold}Total Unrealized PnL:{/bold}
 ${pnlStr}
    `);
    this.screen.render();
  }

  private updateStatusBar(): void {
    const viewName = this.state.currentView.charAt(0).toUpperCase() + this.state.currentView.slice(1);
    const wallet = this.state.walletAddress
      ? `{green-fg}${formatAddress(this.state.walletAddress)}{/green-fg} | {green-fg}${this.state.walletBalance} XLM{/green-fg}`
      : '{red-fg}No Wallet{/red-fg}';

    this.statusBar.setContent(
      ` {bold}${viewName}{/bold} | ${wallet} | {green-fg}[1-5]{/green-fg} Nav  {green-fg}[B]{/green-fg}uy  {red-fg}[S]{/red-fg}ell  {green-fg}[L]{/green-fg}ong  {red-fg}[H]{/red-fg}ort  {green-fg}[R]{/green-fg}efresh  {red-fg}[Q]{/red-fg}uit`
    );
    this.screen.render();
  }

  // ============ TRADING DIALOGS ============

  private async showBuyDialog(): Promise<void> {
    if (!this.state.selectedToken) {
      this.showMessage('Select a token first', 'error');
      return;
    }
    if (!isWalletConfigured()) {
      this.showMessage('Set up wallet first (press 5)', 'error');
      return;
    }

    const token = this.state.selectedToken;
    await this.showTradeInputDialog('buy', token);
  }

  private async showSellDialog(): Promise<void> {
    if (!this.state.selectedToken) {
      this.showMessage('Select a token first', 'error');
      return;
    }
    if (!isWalletConfigured()) {
      this.showMessage('Set up wallet first (press 5)', 'error');
      return;
    }

    const token = this.state.selectedToken;
    await this.showTradeInputDialog('sell', token);
  }

  private async showTradeInputDialog(type: 'buy' | 'sell', token: Token): Promise<void> {
    const dialog = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 20,
      label: ` {green-fg}${type === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}{/green-fg} `,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
      shadow: true,
      keys: true,
    });

    const price = parseFloat(token.currentPrice) / 1e8;

    const content = blessed.box({
      parent: dialog,
      top: 1,
      left: 2,
      width: '90%',
      height: 6,
      tags: true,
      content: `
 {bold}Token:{/bold} {green-fg}${token.symbol}{/green-fg} - ${token.name}
 {bold}Price:{/bold} $${price.toFixed(8)}

 {bold}Amount (${type === 'buy' ? 'XLM' : token.symbol}):{/bold}`,
    });

    const input = blessed.textbox({
      parent: dialog,
      top: 7,
      left: 2,
      width: 30,
      height: 3,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'green' }, focus: { border: { fg: 'yellow' } } },
      inputOnFocus: true,
    });

    const quoteBox = blessed.box({
      parent: dialog,
      top: 11,
      left: 2,
      width: '90%',
      height: 5,
      tags: true,
      content: '{gray-fg}Enter amount and press Enter{/gray-fg}',
    });

    const hint = blessed.text({
      parent: dialog,
      bottom: 1,
      left: 2,
      tags: true,
      content: '{green-fg}[Enter]{/green-fg} Get Quote  {red-fg}[Escape]{/red-fg} Cancel',
    });

    input.on('submit', async (value: string) => {
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        quoteBox.setContent('{red-fg}Invalid amount!{/red-fg}');
        this.screen.render();
        input.focus();
        return;
      }

      quoteBox.setContent('{yellow-fg}Fetching quote...{/yellow-fg}');
      this.screen.render();

      try {
        if (type === 'buy') {
          const quote = await getBuyQuote(token.address, value);
          const tokensOut = Number(quote.tokensOut) / 1e18;
          const fee = Number(quote.fee) / 1e18;

          quoteBox.setContent(`
 {bold}You receive:{/bold} {green-fg}${tokensOut.toFixed(4)} ${token.symbol}{/green-fg}
 {bold}Fee:{/bold} ${fee.toFixed(6)} XLM | {bold}Impact:{/bold} ${quote.priceImpact.toFixed(2)}%

 {green-fg}[Y]{/green-fg} Confirm  {red-fg}[N]{/red-fg} Cancel`);

          dialog.key(['y', 'Y'], async () => {
            dialog.destroy();
            this.screen.render();
            await this.executeBuy(token, value, quote.tokensOut);
          });

          dialog.key(['n', 'N', 'escape'], () => {
            dialog.destroy();
            this.screen.render();
          });

          dialog.focus();
          this.screen.render();
        } else {
          const quote = await getSellQuote(token.address, value);
          const ethOut = Number(quote.ethOut) / 1e18;
          const fee = Number(quote.fee) / 1e18;

          quoteBox.setContent(`
 {bold}You receive:{/bold} {green-fg}${ethOut.toFixed(6)} XLM{/green-fg}
 {bold}Fee:{/bold} ${fee.toFixed(6)} XLM | {bold}Impact:{/bold} ${quote.priceImpact.toFixed(2)}%

 {green-fg}[Y]{/green-fg} Confirm  {red-fg}[N]{/red-fg} Cancel`);

          dialog.key(['y', 'Y'], async () => {
            dialog.destroy();
            this.screen.render();
            await this.executeSell(token, value, quote.ethOut);
          });

          dialog.key(['n', 'N', 'escape'], () => {
            dialog.destroy();
            this.screen.render();
          });

          dialog.focus();
          this.screen.render();
        }
      } catch (error) {
        quoteBox.setContent(`{red-fg}Error: ${(error as Error).message}{/red-fg}`);
        this.screen.render();
      }
    });

    input.key(['escape'], () => {
      dialog.destroy();
      this.screen.render();
    });

    input.focus();
    this.screen.render();
  }

  private async executeBuy(token: Token, amount: string, minTokens: bigint): Promise<void> {
    const password = await this.promptPassword();
    if (!password) return;

    if (password.length < 6) {
      this.showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    this.showLoading('Validating transaction...');

    try {
      this.showLoading('Executing buy transaction...');
      // Pass the quote's minTokens - slippage is now handled in contracts.ts
      const result = await buyTokens(token.address, amount, minTokens, password);
      this.hideLoading();

      const tokensFormatted = (Number(result.tokensReceived) / 1e18).toFixed(4);
      this.showMessage(`Success! Bought ${tokensFormatted} ${token.symbol}`, 'success');

      // Refresh data to show updated balances
      await this.refreshData();
    } catch (error) {
      this.hideLoading();
      this.showMessage((error as Error).message, 'error');
    }
  }

  private async executeSell(token: Token, amount: string, minEth: bigint): Promise<void> {
    const password = await this.promptPassword();
    if (!password) return;

    if (password.length < 6) {
      this.showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    this.showLoading('Validating transaction...');

    try {
      this.showLoading('Executing sell transaction...');
      // Pass the quote's minEth - slippage is now handled in contracts.ts
      const result = await sellTokens(token.address, amount, minEth, password);
      this.hideLoading();

      const ethFormatted = (Number(result.ethReceived) / 1e18).toFixed(6);
      this.showMessage(`Success! Received ${ethFormatted} XLM`, 'success');

      // Refresh data to show updated balances
      await this.refreshData();
    } catch (error) {
      this.hideLoading();
      this.showMessage((error as Error).message, 'error');
    }
  }

  private async showOpenPositionDialog(isLong: boolean): Promise<void> {
    if (!this.state.selectedToken) {
      this.showMessage('Select a token first', 'error');
      return;
    }
    if (!isWalletConfigured()) {
      this.showMessage('Set up wallet first (press 5)', 'error');
      return;
    }

    const token = this.state.selectedToken;
    const side = isLong ? '{green-fg}LONG{/green-fg}' : '{red-fg}SHORT{/red-fg}';

    const dialog = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 18,
      label: ` Open ${isLong ? 'Long' : 'Short'} Position `,
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: isLong ? 'green' : 'red' } },
      shadow: true,
      keys: true,
    });

    const price = parseFloat(token.currentPrice) / 1e8;

    blessed.box({
      parent: dialog,
      top: 1,
      left: 2,
      width: '90%',
      height: 3,
      tags: true,
      content: ` {bold}${token.symbol}{/bold} ${side} | Price: $${price.toFixed(8)}`,
    });

    blessed.text({ parent: dialog, top: 4, left: 2, content: 'Margin (XLM):', tags: true });
    const marginInput = blessed.textbox({
      parent: dialog,
      top: 5,
      left: 2,
      width: 20,
      height: 3,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
      inputOnFocus: true,
    });

    blessed.text({ parent: dialog, top: 4, left: 25, content: 'Leverage:', tags: true });
    const leverageInput = blessed.textbox({
      parent: dialog,
      top: 5,
      left: 25,
      width: 15,
      height: 3,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
      inputOnFocus: true,
    });
    leverageInput.setValue('10');

    const infoBox = blessed.box({
      parent: dialog,
      top: 9,
      left: 2,
      width: '90%',
      height: 4,
      tags: true,
      content: '{gray-fg}Enter margin and leverage{/gray-fg}',
    });

    blessed.text({
      parent: dialog,
      bottom: 1,
      left: 2,
      tags: true,
      content: '{green-fg}[Tab]{/green-fg} Switch  {green-fg}[Enter]{/green-fg} Open  {red-fg}[Escape]{/red-fg} Cancel',
    });

    marginInput.key(['tab'], () => leverageInput.focus());
    leverageInput.key(['tab'], () => marginInput.focus());

    const submit = async () => {
      const margin = marginInput.getValue();
      const leverage = parseInt(leverageInput.getValue()) || 10;

      if (!margin || parseFloat(margin) <= 0) {
        infoBox.setContent('{red-fg}Invalid margin!{/red-fg}');
        this.screen.render();
        return;
      }

      if (leverage < 1 || leverage > 100) {
        infoBox.setContent('{red-fg}Leverage must be 1-100!{/red-fg}');
        this.screen.render();
        return;
      }

      const size = parseFloat(margin) * leverage;
      const liqPrice = isLong
        ? price * (1 - 0.9 / leverage)
        : price * (1 + 0.9 / leverage);

      infoBox.setContent(`
 Size: ${size.toFixed(2)} XLM | Liq: $${liqPrice.toFixed(8)}
 {green-fg}[Y]{/green-fg} Confirm  {red-fg}[N]{/red-fg} Cancel`);

      dialog.key(['y', 'Y'], async () => {
        dialog.destroy();
        this.screen.render();
        await this.executeOpenPosition(token, isLong, margin, leverage);
      });

      dialog.key(['n', 'N'], () => {
        infoBox.setContent('{gray-fg}Enter margin and leverage{/gray-fg}');
        marginInput.focus();
        this.screen.render();
      });

      dialog.focus();
      this.screen.render();
    };

    marginInput.on('submit', submit);
    leverageInput.on('submit', submit);

    dialog.key(['escape'], () => {
      dialog.destroy();
      this.screen.render();
    });

    marginInput.focus();
    this.screen.render();
  }

  private async executeOpenPosition(token: Token, isLong: boolean, margin: string, leverage: number): Promise<void> {
    const password = await this.promptPassword();
    if (!password) return;

    if (password.length < 6) {
      this.showMessage('Password must be at least 6 characters', 'error');
      return;
    }

    this.showLoading('Validating position...');

    try {
      this.showLoading('Opening position...');
      const result = await openPosition(token.address, isLong, margin, leverage, password);
      this.hideLoading();
      this.showMessage(`Position #${result.positionId} opened!`, 'success');
      await this.refreshData();
    } catch (error) {
      this.hideLoading();
      this.showMessage(`Error: ${(error as Error).message}`, 'error');
    }
  }

  private async showClosePositionDialog(): Promise<void> {
    if (this.state.currentView !== 'positions') {
      this.showMessage('Go to Positions view first (press 3)', 'error');
      return;
    }

    const index = (this.tokenList as any).selected || 0;
    const position = this.state.positions[index];

    if (!position) {
      this.showMessage('Select a position first', 'error');
      return;
    }

    const confirmed = await this.promptConfirm(`Close position #${position.positionId}?`);
    if (!confirmed) return;

    const password = await this.promptPassword();
    if (!password) return;

    this.showLoading('Closing position...');

    try {
      await closePosition(position.positionId, password);
      this.hideLoading();
      this.showMessage(`Position #${position.positionId} closed!`, 'success');
      await this.refreshData();
    } catch (error) {
      this.hideLoading();
      this.showMessage(`Error: ${(error as Error).message}`, 'error');
    }
  }

  // ============ WALLET DIALOGS ============

  private async generateWallet(): Promise<void> {
    if (this.state.currentView !== 'wallet') return;

    if (isWalletConfigured()) {
      const confirmed = await this.promptConfirm('Replace existing wallet?');
      if (!confirmed) return;
    }

    const wallet = generateNewWallet();

    // Show mnemonic
    const dialog = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 70,
      height: 16,
      label: ' {yellow-fg}Save Your Recovery Phrase{/yellow-fg} ',
      tags: true,
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: 'yellow' } },
      shadow: true,
    });

    dialog.setContent(`
 {bold}{yellow-fg}IMPORTANT: Save this recovery phrase!{/yellow-fg}{/bold}

 This is the ONLY way to recover your wallet.

 {green-fg}${wallet.mnemonic}{/green-fg}

 {bold}Address:{/bold} ${wallet.address}

 {green-fg}[C]{/green-fg} I have saved it, continue
 {red-fg}[Escape]{/red-fg} Cancel`);

    this.screen.render();

    dialog.key(['c', 'C'], async () => {
      dialog.destroy();
      const password = await this.promptNewPassword();
      if (password) {
        saveWallet(wallet.privateKey, password);
        this.state.walletAddress = wallet.address;
        this.showMessage('Wallet created!', 'success');
        await this.refreshData();
        this.switchView('wallet');
      }
    });

    dialog.key(['escape'], () => {
      dialog.destroy();
      this.screen.render();
    });

    dialog.focus();
  }

  private async importPrivateKey(): Promise<void> {
    if (this.state.currentView !== 'wallet') return;

    const key = await this.promptInput('Enter private key (64 hex chars):');
    if (!key) return;

    try {
      const wallet = accountFromPrivateKey(key);
      const password = await this.promptNewPassword();
      if (password) {
        saveWallet(wallet.privateKey, password);
        this.state.walletAddress = wallet.address;
        this.showMessage('Wallet imported!', 'success');
        await this.refreshData();
        this.switchView('wallet');
      }
    } catch (error) {
      this.showMessage(`Invalid key: ${(error as Error).message}`, 'error');
    }
  }

  private async importMnemonic(): Promise<void> {
    if (this.state.currentView !== 'wallet') return;

    const mnemonic = await this.promptInput('Enter mnemonic (12/24 words):');
    if (!mnemonic) return;

    try {
      const wallet = walletFromMnemonic(mnemonic);
      const password = await this.promptNewPassword();
      if (password) {
        saveWallet(wallet.privateKey, password);
        this.state.walletAddress = wallet.address;
        this.showMessage('Wallet imported!', 'success');
        await this.refreshData();
        this.switchView('wallet');
      }
    } catch (error) {
      this.showMessage(`Invalid mnemonic: ${(error as Error).message}`, 'error');
    }
  }

  // ============ SEARCH ============

  private async showSearchDialog(): Promise<void> {
    const query = await this.promptInput('Search tokens:');
    if (!query) return;

    this.showLoading('Searching...');

    try {
      const results = await searchTokens(query);
      if (results.length > 0) {
        this.state.tokens = results;
        this.updateTokenList();
        this.state.selectedToken = results[0];
        this.updateTokenDetails();
        this.showMessage(`Found ${results.length} tokens`, 'success');
      } else {
        this.showMessage('No tokens found', 'error');
      }
    } catch (error) {
      this.showMessage(`Search failed: ${(error as Error).message}`, 'error');
    }

    this.hideLoading();
  }

  // ============ HELPERS ============

  private promptPassword(): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = blessed.box({
        parent: this.screen,
        top: 'center',
        left: 'center',
        width: 50,
        height: 8,
        label: ' {green-fg}Password{/green-fg} ',
        tags: true,
        border: { type: 'line' },
        style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
        shadow: true,
      });

      blessed.text({ parent: dialog, top: 1, left: 2, content: 'Enter wallet password:', tags: true });

      const input = blessed.textbox({
        parent: dialog,
        top: 3,
        left: 2,
        width: '90%',
        height: 3,
        border: { type: 'line' },
        style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
        censor: true,
        inputOnFocus: true,
      });

      input.on('submit', (value: string) => {
        dialog.destroy();
        this.screen.render();
        resolve(value);
      });

      input.key(['escape'], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      input.focus();
      this.screen.render();
    });
  }

  private promptNewPassword(): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = blessed.box({
        parent: this.screen,
        top: 'center',
        left: 'center',
        width: 50,
        height: 12,
        label: ' {green-fg}Set Password{/green-fg} ',
        tags: true,
        border: { type: 'line' },
        style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
        shadow: true,
      });

      blessed.text({ parent: dialog, top: 1, left: 2, content: 'New password (min 6 chars):', tags: true });
      const input1 = blessed.textbox({
        parent: dialog, top: 2, left: 2, width: '90%', height: 3,
        border: { type: 'line' }, style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
        censor: true, inputOnFocus: true,
      });

      blessed.text({ parent: dialog, top: 5, left: 2, content: 'Confirm password:', tags: true });
      const input2 = blessed.textbox({
        parent: dialog, top: 6, left: 2, width: '90%', height: 3,
        border: { type: 'line' }, style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
        censor: true, inputOnFocus: true,
      });

      input1.key(['tab', 'enter'], () => input2.focus());

      input2.on('submit', () => {
        const p1 = input1.getValue();
        const p2 = input2.getValue();
        if (p1.length < 6) {
          this.showMessage('Password too short!', 'error');
          return;
        }
        if (p1 !== p2) {
          this.showMessage('Passwords do not match!', 'error');
          return;
        }
        dialog.destroy();
        this.screen.render();
        resolve(p1);
      });

      dialog.key(['escape'], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      input1.focus();
      this.screen.render();
    });
  }

  private promptInput(message: string): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = blessed.box({
        parent: this.screen,
        top: 'center',
        left: 'center',
        width: 60,
        height: 8,
        label: ' {green-fg}Input{/green-fg} ',
        tags: true,
        border: { type: 'line' },
        style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
        shadow: true,
      });

      blessed.text({ parent: dialog, top: 1, left: 2, content: message, tags: true });

      const input = blessed.textbox({
        parent: dialog,
        top: 3,
        left: 2,
        width: '90%',
        height: 3,
        border: { type: 'line' },
        style: { fg: 'white', bg: 'black', border: { fg: 'green' } },
        inputOnFocus: true,
      });

      input.on('submit', (value: string) => {
        dialog.destroy();
        this.screen.render();
        resolve(value);
      });

      input.key(['escape'], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      input.focus();
      this.screen.render();
    });
  }

  private promptConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = blessed.box({
        parent: this.screen,
        top: 'center',
        left: 'center',
        width: 50,
        height: 7,
        label: ' {yellow-fg}Confirm{/yellow-fg} ',
        tags: true,
        border: { type: 'line' },
        style: { fg: 'white', bg: 'black', border: { fg: 'yellow' } },
        shadow: true,
      });

      dialog.setContent(`\n ${message}\n\n {green-fg}[Y]{/green-fg} Yes  {red-fg}[N]{/red-fg} No`);

      dialog.key(['y', 'Y'], () => {
        dialog.destroy();
        this.screen.render();
        resolve(true);
      });

      dialog.key(['n', 'N', 'escape'], () => {
        dialog.destroy();
        this.screen.render();
        resolve(false);
      });

      dialog.focus();
      this.screen.render();
    });
  }

  private showLoading(message: string): void {
    this.loadingBox.setContent(`{center}\n{yellow-fg}${message}{/yellow-fg}{/center}`);
    this.loadingBox.show();
    this.screen.render();
  }

  private hideLoading(): void {
    this.loadingBox.hide();
    this.screen.render();
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'yellow';

    const msg = blessed.message({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 50,
      height: 'shrink',
      border: { type: 'line' },
      style: { fg: 'white', bg: 'black', border: { fg: color } },
      tags: true,
    });

    msg.display(`{${color}-fg}${message}{/${color}-fg}`, 2, () => {
      this.screen.render();
    });
  }

  public run(): void {
    this.screen.render();
  }
}
