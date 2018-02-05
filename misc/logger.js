"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
;
let options = null;
class Logger {
    constructor(ns) {
        this._canLog = false;
        this._ns = ns;
        if (options) {
            this._level = options[this._ns] || options.all || 'warn';
            if (options.hasOwnProperty('all') || options.hasOwnProperty(this._ns))
                this._canLog = true;
            else
                this._canLog = false;
        }
        else {
            this._canLog = false;
        }
    }
    static SetOptions(opt) {
        options = opt || null;
    }
    static Error(...args) {
        console.trace(chalk.default.red.bold(`[error] ->`, ...args));
    }
    static Warn(...args) {
        console.log(chalk.default.yellow(`[warn] ->`, ...args));
    }
    static Info(...args) {
        console.log(chalk.default.blue(`[info] ->`, ...args));
    }
    static Debug(...args) {
        console.log(chalk.default.gray(`[debug] ->`, ...args));
    }
    error(...args) {
        if (this._canLog)
            console.trace(chalk.default.red.bold(`[error] ->`, ...args));
    }
    warn(...args) {
        if (this._canLog && this._level !== 'error')
            console.log(chalk.default.yellow(`${this._ns}: [warn] ->`, ...args));
    }
    info(...args) {
        if (this._canLog && (this._level === 'info' || this._level === 'debug'))
            console.log(chalk.default.blue(`${this._ns}: [info] ->`, ...args));
    }
    debug(...args) {
        if (this._canLog && this._level === 'debug')
            console.log(chalk.default.gray(`${this._ns}: [debug] ->`, ...args));
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map