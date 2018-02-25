import { IServerConfigOptions, IGypsumConfigurations } from './config';
import { IMiddlewares } from './state';
import { Model } from './models/model';
import { Context } from './context';
import { MongoModel, FileModel } from './models';
import { IHook } from './decorators';
export { IGypsumConfigurations };
export interface IGypsumUseOptions {
    models?: any[];
    middlewares?: IMiddlewares;
    hooks?: ((ctx: Context, ...args: any[]) => void)[];
}
export interface IGypsum {
    root: string;
    env: string;
    dev: boolean;
    get: (name: keyof IServerConfigOptions) => any;
    set: <T extends keyof IServerConfigOptions, U extends IServerConfigOptions[T]>(name: T, value: U) => IGypsum;
    getModel: (name: string) => Model | MongoModel | FileModel | undefined;
    getModelConstructor: (name: string) => typeof Model | typeof MongoModel | typeof FileModel | undefined;
    getHook: (name: string) => IHook | undefined;
    configure: (userConfig?: IGypsumConfigurations) => IGypsum;
    use: (options: IGypsumUseOptions) => IGypsum;
    bootstrap: () => void;
}
export declare const Gypsum: IGypsum;
