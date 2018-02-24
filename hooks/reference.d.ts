import { Context } from '../context';
export interface IReferenceHookOptions {
    path: string;
    model: string;
    projections?: {
        [key: string]: any;
    };
}
export declare function reference(ctx: Context, options: IReferenceHookOptions): void;
