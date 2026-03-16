import blessed from 'blessed';
import type { Token } from '../types.js';
export declare function createDialog(screen: blessed.Widgets.Screen, title: string, width?: string | number, height?: string | number): blessed.Widgets.BoxElement;
export declare function promptPassword(screen: blessed.Widgets.Screen, message?: string): Promise<string | null>;
export declare function promptConfirm(screen: blessed.Widgets.Screen, message: string): Promise<boolean>;
export declare function promptAmount(screen: blessed.Widgets.Screen, title: string, hint?: string): Promise<string | null>;
export declare function showBuyDialog(screen: blessed.Widgets.Screen, token: Token, onComplete: (success: boolean, message: string) => void): Promise<void>;
export declare function showSellDialog(screen: blessed.Widgets.Screen, token: Token, onComplete: (success: boolean, message: string) => void): Promise<void>;
export declare function showOpenPositionDialog(screen: blessed.Widgets.Screen, token: Token, isLong: boolean, onComplete: (success: boolean, message: string) => void): Promise<void>;
export declare function showWalletSetupDialog(screen: blessed.Widgets.Screen, onComplete: (success: boolean, message: string) => void): Promise<void>;
export declare function showNotification(screen: blessed.Widgets.Screen, title: string, message: string, type?: 'success' | 'error' | 'info'): void;
//# sourceMappingURL=Dialogs.d.ts.map