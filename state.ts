// import * as path from 'path';
// import * as fs from 'fs';
import * as express from 'express';
import * as IO from 'socket.io';
import { Config, IConfig, IGypsumConfig, IAuthenticationConfigOptions, IServerConfigOptions, IApp } from './config';
import { Context } from './context';
import { Model } from './models';
import { stringUtil } from './util/string';
import { FRIEND } from './decorators/friend';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';

let safe = new Safe('state');

export interface IMiddleware {
  (app: express.Express): void;
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
  authConfig = <IAuthenticationConfigOptions>{};
  apps = <IApp[]>[];
  models: Model[] = [];
  Models: typeof Model[] = [];
  middlewares: IMiddlewares = {};
  hooks: ((ctx: Context, ...args: any[]) => void)[] = [];

  getModel(name: string) {
    return this.models.find(model => model.$get('name') === name) || undefined;
  }

  getHook(name: string) {
    return this.hooks.find(hook => hook.name === name) || undefined;
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
    
    if (userConfig.dev) {
      if (userConfig.dev.authConfig)
        Object.assign(this.authConfig, (<any>Config).dev.authConfig, userConfig.dev.authConfig);
      else
        Object.assign(this.authConfig, (<any>Config).dev.authConfig);

      if (userConfig.dev.server)
        Object.assign(this.config, (<any>Config).dev.server, userConfig.dev.server);
      else        
        Object.assign(this.config, (<any>Config).dev.server);

    } else {
      Object.assign(this.authConfig, (<any>Config).dev.authConfig);
      Object.assign(this.config, (<any>Config).dev.server);
    }

    if (this.env === 'production') {

      if (userConfig.prod) {
        if (userConfig.prod.authConfig)
          Object.assign(this.authConfig, (<any>Config).prod.authConfig, userConfig.prod.authConfig);
        else
          Object.assign(this.authConfig, (<any>Config).prod.authConfig);

        if (userConfig.prod.server)
          Object.assign(this.config, (<any>Config).prod.server, userConfig.prod.server);
        else
          Object.assign(this.config, (<any>Config).prod.server);

        if (userConfig.prod.apps && userConfig.prod.apps.length)
          this.apps = userConfig.prod.apps;

      } else {
        Object.assign(this.authConfig, (<any>Config).prod.authConfig);
        Object.assign(this.config, (<any>Config).prod.server);
      }
    } else if (userConfig.dev && userConfig.dev.apps && userConfig.dev.apps.length) {
      this.apps = userConfig.dev.apps;
    }

    if (this.config.services_prefix)
      this.config.services_prefix = '/' + stringUtil.cleanPath(this.config.services_prefix);

    this.config.files_data_dir = stringUtil.cleanPath(<string>this.config.files_data_dir);
  }
}

const State = new AppState();

export { State };