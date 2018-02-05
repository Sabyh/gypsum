export interface IHook {
    isHook: boolean;
    name: string;
    private: boolean;
}
export declare type IHookOptions = string | {
    name: string;
    args?: any;
};
