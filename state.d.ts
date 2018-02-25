import * as express from 'express';
import { IGypsumConfig, IServerConfigOptions, IApp } from './config';
import { Model, MongoModel, FileModel } from './models';
import { IHook } from './decorators';
export interface IMiddleware {
    (app: express.Express): void;
}
export interface IMiddlewares {
    [key: string]: {
        before: IMiddleware[];
        after: IMiddleware[];
    };
}
export declare class AppState {
    private _sockets;
    protected _io: any;
    readonly router: express.Router;
    readonly root: string;
    readonly env: string;
    config: IServerConfigOptions;
    apps: IApp[];
    models: Model[];
    Models: typeof Model[];
    middlewares: IMiddlewares;
    hooks: IHook[];
    getModelConstructor(name: string): typeof Model | typeof MongoModel | typeof FileModel | undefined;
    getModel(name: string): Model | MongoModel | FileModel | undefined;
    getHook(name: string): IHook | undefined;
    getSocket(id: string): any;
    pushSocket(socket: any): void;
    deleteSocket(id: string): void;
    setConfiguration(userConfig?: IGypsumConfig): void;
}
declare const State: AppState;
export { State };
