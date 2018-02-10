import { IServerConfigOptions, IAuthenticationConfigOptions, IGypsumConfigurations } from './config';
import { IMiddlewares } from './state';
import { Context } from './context';
export interface IGypsumUseOptions {
    models?: any[];
    middlewares?: IMiddlewares;
    hooks?: ((ctx: Context, ...args: any[]) => void)[];
}
export interface IGypsum {
    root: string;
    env: string;
    dev: boolean;
    get: (name: keyof (IServerConfigOptions & IAuthenticationConfigOptions)) => any;
    configure: (userConfig?: IGypsumConfigurations) => IGypsum;
    use: (options: IGypsumUseOptions) => IGypsum;
    bootstrap: () => void;
}
export declare const Gypsum: IGypsum;
