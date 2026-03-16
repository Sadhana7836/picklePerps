export declare function promptPassword(message?: string): Promise<string>;
export declare function promptNewPassword(): Promise<string>;
export declare function promptConfirm(message: string, defaultValue?: boolean): Promise<boolean>;
export declare function promptSelect<T extends string>(message: string, choices: Array<{
    name: string;
    value: T;
    description?: string;
}>): Promise<T>;
export declare function promptInput(message: string, options?: {
    default?: string;
    validate?: (input: string) => boolean | string;
}): Promise<string>;
export declare function promptMnemonic(): Promise<string>;
export declare function promptPrivateKey(): Promise<string>;
export declare function promptAmount(message: string, options?: {
    min?: number;
    max?: number;
}): Promise<string>;
export declare function promptLeverage(): Promise<number>;
export declare function promptTokenAddress(): Promise<string>;
//# sourceMappingURL=prompts.d.ts.map