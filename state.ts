// import * as path from 'path';
// import * as fs from 'fs';
import * as express from 'express';
import * as IO from 'socket.io';
import { Config, IConfig, IGypsumConfig, IServerConfigOptions, IApp } from './config';
import { Context } from './context';
import { Model, MongoModel, FileModel } from './models';
import { stringUtil } from './util/string';
import { FRIEND, IHook } from './decorators';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';
import { objectUtil } from './util';

let safe = new Safe('state');

export interface IMiddleware {
  (app: express.Express): void;
}

export interface IApplication extends IApp {
  models?: Model[]
}

export interface IMiddlewares {
  [key: string]: { before: IMiddleware[], after: IMiddleware[] }
}

export class AppState {
  private _sockets: { [key: string]: any } = {};

  @FRIEND(safe.set('State._io', ['ioServer', 'context']), true, true)
  protected _io: any;

  readonly router: express.Router = express.Router();
  readonly root: string = process.cwd();
  readonly env: string = process.env.NODE_ENV || 'developemt';

  config = <IServerConfigOptions>{};
  apps = <IApplication[]>[];
  Models: typeof Model[] = [];
  middlewares: IMiddlewares = {};
  hooks: IHook[] = [];
  handShake: (socket: any, next: Function) => void;
  onConnect: (socket: any) => void;
  onDisconnect: (socket: any) => void;

  getModelConstructor(name: string): typeof Model | typeof MongoModel | typeof FileModel | undefined {
    return this.Models.find(Model => Model.name === name) || undefined;
  }

  getModel(name: string, appName: string = 'default'): Model | MongoModel | FileModel | undefined {
    let app = this.apps.find(_app => _app.name === appName);

    if (app && app.models)
      return app.models.find(model => model.$get('name') === name.toLowerCase()) || undefined;

    return undefined;
  }

  pushModel(model: Model) {
    let appName = model.$get('app');
    let app = this.apps.find(_app => _app.name === appName);

    if (app) {
      if (app.models)
        app.models.push(model);
      else
        app.models = [model];
    } else {
      app = this.apps.find(_app => _app.name === 'default');

      if (app)
        if (app.models)
          app.models.push(model);
        else
          app.models = [model];
    }
  }

  getHook(name: string): IHook | undefined {
    return this.hooks.find(hook => (<any>hook).__name === name) || undefined;
  }

  getSocket(id: string) {
    return this._sockets[id];
  }

  public pushSocket(socket: any) {
    this._sockets[socket.id] = socket;
  }

  public deleteSocket(id: string) {
    Logger.Info('Deleting socket from server state with id:', id);
    delete this._sockets[id];
  }

  public setConfiguration(userConfig: IGypsumConfig = <IGypsumConfig>{}) {

    objectUtil.extend(this.config, Config.dev);

    if (userConfig.dev)
      objectUtil.extend(this.config, userConfig.dev);

    if (this.env === 'production' && userConfig.prod)
      objectUtil.extend(this.config, userConfig.prod);

    this.apps = this.config.apps || [];

    if (this.config.services_prefix)
      this.config.services_prefix = '/' + stringUtil.cleanPath(this.config.services_prefix);

    this.config.files_data_dir = stringUtil.cleanPath(<string>this.config.files_data_dir);
  }
}

const State = new AppState();

export { State };