// import * as path from 'path';
// import * as fs from 'fs';
import * as express from 'express';
import * as IO from 'socket.io';
import { Config, IGypsumConfig, IServerConfigOptions, IApp } from './config';
import { Context } from './context';
import { Model, MongoModel, FileModel } from './models';
import { stringUtil } from './util/string';
import { FRIEND, IHook } from './decorators';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';
import { objectUtil } from './util';
import { App } from './app';

let safe = new Safe('state');

export interface IMiddleware {
  (app: express.Express): void;
}

export interface IApplication extends IApp {
  models?: Model[]
}

export class AppState {
  private _sockets: { [key: string]: any } = {};

  @FRIEND(safe.set('State._io', ['ioServer', 'context']), true, true)

  readonly router: express.Router = express.Router();
  readonly root: string = process.cwd();
  readonly env: string = process.env.NODE_ENV || 'developemt';

  ioNamespaces: { [key: string]: any } = {};
  config = <IServerConfigOptions>{};
  apps = <App[]>[];
  middlewares: Function;
  hooks: IHook[] = [];

  getModel(name: string, appName: string): Model | MongoModel | FileModel | undefined {
    let app = this.apps.find(_app => _app.name.toLowerCase() === appName.toLowerCase());

    if (app && app.models)
      return app.models.find(model => model.name === name.toLowerCase()) || undefined;

    return undefined;
  }

  getHook(name: string): IHook | undefined {
    return this.hooks.find(hook => (<any>hook).__name.toLowerCase() === name.toLowerCase()) || undefined;
  }

  public setConfiguration(userConfig: IGypsumConfig = <IGypsumConfig>{}) {

    objectUtil.extend(this.config, Config.dev);

    if (userConfig.dev)
      objectUtil.extend(this.config, userConfig.dev);

    if (this.env === 'production' && userConfig.prod)
      objectUtil.extend(this.config, userConfig.prod);

    this.config.files_data_dir = stringUtil.cleanPath(<string>this.config.files_data_dir);
  }
}

const State = new AppState();

export { State };