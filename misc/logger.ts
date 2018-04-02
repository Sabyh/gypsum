import * as path from 'path';
import * as fs from 'fs';
import * as chalk from 'chalk';

export type LoggerLevels = "error" | "warn" | "info" | "debug" | "all";
export interface ILoggerOptions {
  [key: string]: { level: LoggerLevels[]; log?: LoggerLevels[] }
}

let options: ILoggerOptions | null | undefined = null;
let outDir: string;

export class Logger {
  private _ns: string;
  private _logDir: string;
  private _levels: LoggerLevels[];
  private _logOptions: LoggerLevels[] | undefined;
  private _active: boolean = false;

  constructor(ns: string) {
    this._ns = ns;

    if (options) {

      if (options.hasOwnProperty('all') || options.hasOwnProperty(this._ns)) {
        this._levels = options[this._ns] ? options[this._ns].level : options.all.level;
        this._active = true;

        if (outDir) {
          this._logOptions = options[this._ns] ? options[this._ns].log : options.all.log;
          this._logDir = this._logOptions && this._logOptions.length ? path.join(outDir, this._ns) : '';


          if (this._logDir)
            if (!fs.existsSync(this._logDir))
              fs.mkdirSync(this._logDir);
        }

      } else {
        this._active = false;
      }

    } else {
      this._active = false;
    }
  }

  static SetOptions(opt?: ILoggerOptions | null, logOutPath: string = 'server_logs'): void {
    outDir = path.join(process.cwd(), logOutPath);
    options = opt || null;

    if (!fs.existsSync(outDir))
      fs.mkdirSync(outDir);
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
    if (this._active && (this._levels.indexOf('error') > -1 || this._levels.indexOf('all') > -1)) {
      console.trace(chalk.default.red.bold(`[error] ->`, ...args));

      if (this._logOptions && (this._logOptions.indexOf('error') > -1 || this._logOptions.indexOf('all') > -1))
        this._log('error', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this._active && (this._levels.indexOf('warn') > -1 || this._levels.indexOf('all') > -1)) {
      console.log(chalk.default.yellow(`${this._ns}: [warn] ->`, ...args));

      if (this._logOptions && (this._logOptions.indexOf('warn') > -1 || this._logOptions.indexOf('all') > -1))
        this._log('warn', ...args);
    }
  }

  info(...args: any[]): void {
    if (this._active && (this._levels.indexOf('info') > -1 || this._levels.indexOf('all') > -1)) {
      console.log(chalk.default.blue(`${this._ns}: [info] ->`, ...args));

      if (this._logOptions && (this._logOptions.indexOf('info') > -1 || this._logOptions.indexOf('all') > -1))
        this._log('info', ...args);
    }
  }

  debug(...args: any[]): void {
    if (this._active && (this._levels.indexOf('debug') > -1 || this._levels.indexOf('all') > -1)) {
      console.log(chalk.default.gray(`${this._ns}: [debug] ->`, ...args));

      if (this._logOptions && (this._logOptions.indexOf('debug') > -1 || this._logOptions.indexOf('all') > -1))
        this._log('debug', ...args);
    }
  }

  private _log(level: string = 'error', ...args: any[]) {
    args.unshift(new Date());
    args.push('\n');
    let result = args.join(", ");
    fs.appendFile(path.join(this._logDir, level), result, err => {
      if (err) {
        console.log('error logging in:', this._ns);
        console.log(err);
      }
    });
  }
}