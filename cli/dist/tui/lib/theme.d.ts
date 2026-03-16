export declare const colors: {
    primary: string;
    primaryBright: string;
    bg: string;
    bgLight: string;
    bgPanel: string;
    text: string;
    textMuted: string;
    textDim: string;
    success: string;
    error: string;
    warning: string;
    long: string;
    short: string;
    profit: string;
    loss: string;
    border: string;
    borderMuted: string;
};
export declare const styles: {
    box: {
        border: {
            type: "line";
            fg: string;
        };
        style: {
            border: {
                fg: string;
            };
            label: {
                fg: string;
                bold: boolean;
            };
        };
    };
    selected: {
        bg: string;
        fg: string;
        bold: boolean;
    };
    list: {
        selected: {
            bg: string;
            fg: string;
            bold: boolean;
        };
        item: {
            fg: string;
        };
    };
    table: {
        fg: string;
        border: {
            fg: string;
        };
        header: {
            fg: string;
            bold: boolean;
        };
        cell: {
            fg: string;
        };
    };
    button: {
        fg: string;
        bg: string;
        focus: {
            bg: string;
        };
        hover: {
            bg: string;
        };
    };
    input: {
        fg: string;
        bg: string;
        border: {
            fg: string;
        };
        focus: {
            border: {
                fg: string;
            };
        };
    };
};
export declare function formatPrice(price: number | string): string;
export declare function formatNumber(num: number | string): string;
export declare function formatTokenAmount(amount: string | bigint): string;
export declare function formatEth(amount: string | bigint): string;
export declare function formatAddress(address: string): string;
export declare function formatTimeAgo(timestamp: number): string;
export declare function progressBar(percent: number, width?: number): string;
export declare const LOGO = "\n{green-fg}\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557{/green-fg}\n{green-fg}\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551 \u2588\u2588\u2554\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D{/green-fg}\n{green-fg}\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2554\u255D \u2588\u2588\u2588\u2588\u2588\u2557    \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557{/green-fg}\n{green-fg}\u2588\u2588\u2554\u2550\u2550\u2550\u255D \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2588\u2588\u2557 \u2588\u2588\u2554\u2550\u2550\u255D    \u2588\u2588\u2554\u2550\u2550\u2550\u255D \u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551{/green-fg}\n{green-fg}\u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2551  \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551{/green-fg}\n{green-fg}\u255A\u2550\u255D     \u255A\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D  \u255A\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D{/green-fg}\n";
export declare const LOGO_SMALL = "{green-fg}PICKLE PERPS{/green-fg}";
//# sourceMappingURL=theme.d.ts.map