export * from './array';
export * from './crypt';
export * from './object';
export * from './string';
export declare function is<T>(arg: T | any, key: string): arg is T;
export declare function range(start: number, end: number, step?: number): number[];
export declare function random(length?: number, type?: string): string;
export declare function toRegExp(pattern: string): RegExp;
