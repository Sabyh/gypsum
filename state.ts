import * as path from 'path';
import * as express from 'express';
import * as IO from 'socket.io';
import { Config, IGypsumConfig, IServerConfigOptions } from './config';
import { Context } from './context';
import { Model, MongoModel, FileModel } from './models';
import { stringUtil } from './util/string';
import { FRIEND, IHook } from './decorators';
import { Logger } from './misc/logger';
import { objectUtil } from './util';
import { App } from './app';
import { IAuthConfig, IAuthEnvConfig, defaultAuthConfig } from './auth/config';
import { IStorageConfig, defaultStorageConfig, IStorageEnvConfig } from './storage/config';

export interface IMiddleware {
  (app: express.Express): void;
}

export class AppState {
  private _sockets: { [key: string]: any } = {};

  readonly router: express.Router = express.Router();
  readonly root: string = process.cwd();
  readonly env: string = process.env.NODE_ENV || 'developemt';

  ioNamespaces: { [key: string]: any } = {};
  config = <IServerConfigOptions>{};
  apps = <App[]>[];
  storage = <IStorageConfig>{};
  auth: IAuthConfig = <IAuthConfig>{};
  middlewares: Function;
  hooks: IHook[] = [];
  currentContext: Context = null;

  public getModel(appName: string, name: string): Model | MongoModel | FileModel {
    let app = this.apps.find(_app => _app.name.toLowerCase() === appName.toLowerCase());

    if (app)
      return app.$getModel(name.toLowerCase());

    return null;
  }

  public getHook(name: string): IHook {
    return this.hooks.find(hook => (<any>hook).name.toLowerCase() === name.toLowerCase()) || null;
  }

  public setConfiguration(userConfig: IGypsumConfig = <IGypsumConfig>{}) {

    objectUtil.extend(this.config, Config.dev);

    if (userConfig.dev)
      objectUtil.extend(this.config, userConfig.dev);

    if (this.env === 'production' && userConfig.prod)
      objectUtil.extend(this.config, userConfig.prod);

    this.config.files_data_dir = stringUtil.cleanPath(<string>this.config.files_data_dir);
  }

  public setAuthConfig(auth: IAuthEnvConfig = <IAuthEnvConfig>{}) {
    this.auth = objectUtil.extend(defaultAuthConfig, auth.dev || {});

    if (this.env === 'production' && auth.prod)
      objectUtil.extend(this.auth, auth.prod);
  }

  public setStorageConfig(storageConfig: IStorageEnvConfig = <IStorageEnvConfig>{}) {
    this.storage = objectUtil.extend(defaultStorageConfig, storageConfig.dev || {});

    if (this.env === 'production' && storageConfig.prod)
      objectUtil.extend(this.storage, storageConfig.prod);

    this.storage.storageDir = path.join(this.root, this.storage.storageDir);
  }
}

const State = new AppState();

export { State };