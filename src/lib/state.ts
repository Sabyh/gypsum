// import * as path from 'path';
// import * as fs from 'fs';
import * as express from 'express';
// import * as SocketIO from 'socket.io';
import { Config, IConfig, IGypsumConfig, IAuthenticationConfigOptions, IServerConfigOptions } from './config';
import { Model } from './model/model';
import { stringUtil } from './util/string';
import { FRIEND } from './decorators/friend';
import { Safe } from './misc/safe';
import { Context } from './context';

let safe = new Safe('state');

export interface IMiddleware {
  (app: express.Express): void;
}

export interface IMiddlewares {
  before: IMiddleware[],
  after: IMiddleware[]
}

export class AppState {
  private _sockets: { [key: string]: SocketIO.Socket } = {};

  @FRIEND(safe.set('State._io', ['ioServer', 'context']), true, true)
  protected _io: SocketIO.Server;

  readonly router: express.Router = express.Router();
  readonly root: string = process.cwd();
  readonly env: string = process.env.NODE_ENV || 'developemt';

  config = <IAuthenticationConfigOptions & IServerConfigOptions>{};
  models: Model[] = [];
  Models: typeof Model[] = [];
  middlewares: IMiddlewares = { before: [], after: [] };
  hooks: ((ctx: Context, ...args: any[]) => void)[] = [];

  getModel(name: string) {
    return this.models.find(model => model.$get('name') === name) || undefined;
  }

  getHook(name: string) {
    return this.hooks.find(hook => hook.name === name) || undefined;
  }

  public pushSocket(socket: SocketIO.Socket) {
    this._sockets[socket.id] = socket;
  }

  public deleteSocket(id: string) {
    delete this._sockets[id];
  }

  get sockets() {
    let self = this;
    return function* () {
      for (let prop in self._sockets)
        yield self._sockets[prop];
    }
  }

  public setConfiguration(userConfig: IGypsumConfig = <IGypsumConfig>{}) {
    
    if (userConfig.dev && userConfig.dev.authConfig)
      Object.assign(this.config, (<any>Config).dev.authConfig, userConfig.dev.authConfig);
    else
      Object.assign(this.config, (<any>Config).dev.authConfig);

    if (userConfig.dev && userConfig.dev.server)
      Object.assign(this.config, (<any>Config).dev.server, userConfig.dev.server);
    else
      Object.assign(this.config, (<any>Config).dev.server);

    if (this.env === 'production') {
      userConfig.prod = userConfig.prod || {};

      if (userConfig.prod && userConfig.prod.authConfig)
        Object.assign(this.config, userConfig.prod.authConfig);

      if (userConfig.prod && userConfig.prod.server)
        Object.assign(this.config, Config.prod!.server, userConfig.prod.server);
      else
        Object.assign(this.config, Config.prod!.server);
    }

    if (this.config.services_prefix)
      this.config.services_prefix = '/' + stringUtil.cleanPath(this.config.services_prefix);

    if (this.config.static_prefix)
      this.config.static_prefix = '/' + stringUtil.cleanPath(<string>this.config.static_prefix);

    this.config.files_data_dir = stringUtil.cleanPath(<string>this.config.files_data_dir);
  }
}

const State = new AppState();

export { State };