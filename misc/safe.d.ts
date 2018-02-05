export declare class Safe {
    name: string;
    constructor(name: string);
    get<T = Symbol>(item: string): T;
    set<T = Symbol>(item: string, friends: string[]): T;
}
