export declare type LoggerLevels = "error" | "warn" | "info" | "debug";
export interface ILoggerOptions {
    [key: string]: LoggerLevels;
}
export declare class Logger {
    private _ns;
    private _level;
    private _canLog;
    constructor(ns: string);
    static SetOptions(opt?: ILoggerOptions | null): void;
    static Error(...args: any[]): void;
    static Warn(...args: any[]): void;
    static Info(...args: any[]): void;
    static Debug(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
}
