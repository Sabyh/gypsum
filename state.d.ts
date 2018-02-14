import * as express from 'express';
import { IGypsumConfig, IAuthenticationConfigOptions, IServerConfigOptions, IDatabaseConnection } from './config';
import { Context } from './context';
import { Model } from './models';
export interface IMiddleware {
    (app: express.Express): void;
}
export interface IMiddlewares {
    before: IMiddleware[];
    after: IMiddleware[];
}
export declare class AppState {
    private _sockets;
    protected _io: any;
    readonly router: express.Router;
    readonly root: string;
    readonly env: string;
    config: IAuthenticationConfigOptions & IServerConfigOptions & {
        database: IDatabaseConnection;
    };
    models: Model[];
    Models: typeof Model[];
    middlewares: IMiddlewares;
    hooks: ((ctx: Context, ...args: any[]) => void)[];
    getModel(name: string): Model | undefined;
    getHook(name: string): ((ctx: Context, ...args: any[]) => void) | undefined;
    getSocket(id: string): any;
    pushSocket(socket: any): void;
    deleteSocket(id: string): void;
    setConfiguration(userConfig?: IGypsumConfig): void;
}
declare const State: AppState;
export { State };
