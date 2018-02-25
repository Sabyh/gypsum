import { Context } from "../context";
export interface IHook {
    (ctx: Context, ...args: any[]): void;
}
export interface IModelHook extends IHook {
    isHook: boolean;
    name: string;
    private: boolean;
}
export declare type IHookOptions = string | {
    name: string;
    args?: any;
};
export declare function HOOK(options?: {
    private: boolean;
}): (target: any, key: string, descriptor: PropertyDescriptor) => void;
