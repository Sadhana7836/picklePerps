// Pike Perps TUI Theme - Matching the web app's green theme
export const colors = {
    // Primary green color
    primary: 'green',
    primaryBright: '#00d26a',
    // Background colors
    bg: 'black',
    bgLight: '#1a1a1a',
    bgPanel: '#0d0d0d',
    // Text colors
    text: 'white',
    textMuted: 'gray',
    textDim: '#666666',
    // Status colors
    success: 'green',
    error: 'red',
    warning: 'yellow',
    // Trading colors
    long: 'green',
    short: 'red',
    profit: 'green',
    loss: 'red',
    // Border colors
    border: 'green',
    borderMuted: 'gray',
};
export const styles = {
    // Box styles
    box: {
        border: {
            type: 'line',
            fg: colors.border,
        },
        style: {
            border: { fg: colors.border },
            label: { fg: colors.primary, bold: true },
        },
    },
    // Selected item style
    selected: {
        bg: colors.primary,
        fg: colors.bg,
        bold: true,
    },
    // List styles
    list: {
        selected: {
            bg: colors.primary,
            fg: colors.bg,
            bold: true,
        },
        item: {
            fg: colors.text,
        },
    },
    // Table styles
    table: {
        fg: colors.text,
        border: { fg: colors.border },
        header: {
            fg: colors.primary,
            bold: true,
        },
        cell: {
            fg: colors.text,
        },
    },
    // Button styles
    button: {
        fg: colors.bg,
        bg: colors.primary,
        focus: {
            bg: colors.primaryBright,
        },
        hover: {
            bg: colors.primaryBright,
        },
    },
    // Input styles
    input: {
        fg: colors.text,
        bg: colors.bgLight,
        border: { fg: colors.border },
        focus: {
            border: { fg: colors.primaryBright },
        },
    },
};
// Formatting helpers
export function formatPrice(price) {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (num === 0)
        return '$0.00';
    if (num < 0.000001)
        return `$${num.toExponential(2)}`;
    if (num < 0.01)
        return `$${num.toFixed(8)}`;
    if (num < 1)
        return `$${num.toFixed(6)}`;
    if (num < 1000)
        return `$${num.toFixed(4)}`;
    return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
export function formatNumber(num) {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1_000_000_000)
        return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(2)}K`;
    return n.toFixed(2);
}
export function formatTokenAmount(amount) {
    const num = typeof amount === 'bigint' ? Number(amount) / 1e18 : parseFloat(amount);
    if (num >= 1_000_000)
        return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000)
        return `${(num / 1_000).toFixed(2)}K`;
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
export function formatEth(amount) {
    const num = typeof amount === 'bigint' ? Number(amount) / 1e18 : parseFloat(amount);
    return `${num.toFixed(4)} MNT`;
}
export function formatAddress(address) {
    if (!address || address.length < 10)
        return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
export function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1)
        return 'just now';
    if (minutes < 60)
        return `${minutes}m ago`;
    if (hours < 24)
        return `${hours}h ago`;
    if (days < 30)
        return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}
export function progressBar(percent, width = 10) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent.toFixed(0)}%`;
}
// ASCII Art logo
export const LOGO = `
{green-fg}█████╗ ██╗██╗  ██╗███████╗  ██████╗ ███████╗██████╗ ██████╗ ███████╗{/green-fg}
{green-fg}██╔══██╗██║██║ ██╔╝██╔════╝  ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝{/green-fg}
{green-fg}██████╔╝██║█████╔╝ █████╗    ██████╔╝█████╗  ██████╔╝██████╔╝███████╗{/green-fg}
{green-fg}██╔═══╝ ██║██╔═██╗ ██╔══╝    ██╔═══╝ ██╔══╝  ██╔══██╗██╔═══╝ ╚════██║{/green-fg}
{green-fg}██║     ██║██║  ██╗███████╗  ██║     ███████╗██║  ██║██║     ███████║{/green-fg}
{green-fg}╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝{/green-fg}
`;
export const LOGO_SMALL = '{green-fg}PIKE PERPS{/green-fg}';
//# sourceMappingURL=theme.js.map