import * as express from 'express';
import { IGypsumConfig, IAuthenticationConfigOptions, IServerConfigOptions } from './config';
import { Model } from './model/model';
import { Context } from './context';
export interface IMiddleware {
    (app: express.Express): void;
}
export interface IMiddlewares {
    before: IMiddleware[];
    after: IMiddleware[];
}
export declare class AppState {
    private _sockets;
    protected _io: SocketIO.Server;
    readonly router: express.Router;
    readonly root: string;
    readonly env: string;
    config: IAuthenticationConfigOptions & IServerConfigOptions;
    models: Model[];
    Models: typeof Model[];
    middlewares: IMiddlewares;
    hooks: ((ctx: Context, ...args: any[]) => void)[];
    getModel(name: string): Model | undefined;
    getHook(name: string): ((ctx: Context, ...args: any[]) => void) | undefined;
    pushSocket(socket: SocketIO.Socket): void;
    deleteSocket(id: string): void;
    readonly sockets: () => IterableIterator<SocketIO.Socket>;
    setConfiguration(userConfig?: IGypsumConfig): void;
}
declare const State: AppState;
export { State };
