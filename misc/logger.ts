import * as chalk from 'chalk';

export type LoggerLevels = "error" | "warn" | "info" | "debug";
export interface ILoggerOptions { [key: string]: LoggerLevels; };

let options: ILoggerOptions | null | undefined = null;

export class Logger {
  private _ns: string;
  private _level: LoggerLevels;
  private _canLog: boolean = false;

  constructor(ns: string) {
    this._ns = ns;

    if (options) {
      this._level = options[this._ns] || options.all || 'warn';

      if (options.hasOwnProperty('all') || options.hasOwnProperty(this._ns))
        this._canLog = true;
      else
        this._canLog = false;
    } else {
      this._canLog = false;
    }
  }

  static SetOptions(opt?: ILoggerOptions | null): void {
    options = opt || null;
  }

  static Error(...args: any[]): void {
    console.trace(chalk.default.red.bold(`[error] ->`, ...args));
  }

  static Warn(...args: any[]): void {
    console.log(chalk.default.yellow(`[warn] ->`, ...args));
  }

  static Info(...args: any[]): void {
    console.log(chalk.default.blue(`[info] ->`, ...args));
  }

  static Debug(...args: any[]): void {
    console.log(chalk.default.gray(`[debug] ->`, ...args));
  }

  error(...args: any[]): void {
    if (this._canLog)
      console.trace(chalk.default.red.bold(`[error] ->`, ...args));
  }

  warn(...args: any[]): void {
    if (this._canLog && this._level !== 'error')
      console.log(chalk.default.yellow(`${this._ns}: [warn] ->`, ...args));
  }

  info(...args: any[]): void {
    if (this._canLog && (this._level === 'info' || this._level === 'debug'))
      console.log(chalk.default.blue(`${this._ns}: [info] ->`, ...args));
  }

  debug(...args: any[]): void {
    if (this._canLog && this._level === 'debug')
      console.log(chalk.default.gray(`${this._ns}: [debug] ->`, ...args));
  }
}