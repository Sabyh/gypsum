import * as path from 'path';
import * as express from 'express';
import { URL } from 'tools-box/url';
import { extend } from 'tools-box/object';
import { Config, IGypsumConfig, IServerConfigOptions } from './config';
import { Context } from './context';
import { Model } from './models';
import { IHookFunc } from './decorators';
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
  hooks: IHookFunc[] = [];
  currentContext: Context = null;

  public getApp(name: string): App {
    return this.apps.find(app => app.name.toLowerCase() === name.toLowerCase()) || null;
  }

  public getModel<T extends Model = Model>(path: string): T {
    let appName: string, modelName: string;
    [appName, modelName] = path.split('.');
    let app = this.apps.find(_app => _app.name.toLowerCase() === appName.toLowerCase());

    if (app)
      return <T>app.$getModel(modelName.toLowerCase());

    return null;
  }

  public getHook(name: string): IHookFunc {
    return this.hooks.find(hook => (<any>hook).name.toLowerCase() === name.toLowerCase()) || null;
  }

  public setConfiguration(userConfig: IGypsumConfig = <IGypsumConfig>{}) {

    extend(this.config, Config.dev);

    if (userConfig.dev)
      extend(this.config, userConfig.dev);

    if (this.env === 'production' && userConfig.prod)
      extend(this.config, userConfig.prod);

    this.config.files_data_dir = URL.Clean(<string>this.config.files_data_dir);
  }

  public setAuthConfig(auth: IAuthEnvConfig = <IAuthEnvConfig>{}) {
    this.auth = extend(defaultAuthConfig, auth.dev || {});

    if (this.env === 'production' && auth.prod)
      extend(this.auth, auth.prod);
  }

  public setStorageConfig(storageConfig: IStorageEnvConfig = <IStorageEnvConfig>{}) {
    this.storage = extend(defaultStorageConfig, storageConfig.dev || {});

    if (this.env === 'production' && storageConfig.prod)
      extend(this.storage, storageConfig.prod);

    this.storage.storageDir = path.join(this.root, this.storage.storageDir);
  }
}

const State = new AppState();

export { State };