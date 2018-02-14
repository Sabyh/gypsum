// import * as path from 'path';
// import * as fs from 'fs';
import * as express from 'express';
import * as IO from 'socket.io';
import { Config, IConfig, IGypsumConfig, IAuthenticationConfigOptions, IServerConfigOptions, IDatabaseConnection } from './config';
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
  before: IMiddleware[],
  after: IMiddleware[]
}

export class AppState {
  private _sockets: { [key: string]: any } = {};

  @FRIEND(safe.set('State._io', ['ioServer', 'context']), true, true)
  protected _io: any;

  readonly router: express.Router = express.Router();
  readonly root: string = process.cwd();
  readonly env: string = process.env.NODE_ENV || 'developemt';

  config = <IAuthenticationConfigOptions & IServerConfigOptions & { database: IDatabaseConnection }>{};
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

  // get sockets() {
  //   let self = this;
  //   return function* () {
  //     for (let prop in self._sockets)
  //       yield self._sockets[prop];
  //   }
  // }

  public setConfiguration(userConfig: IGypsumConfig = <IGypsumConfig>{}) {

    if (userConfig.dev && userConfig.dev.authConfig)
      Object.assign(this.config, (<any>Config).dev.authConfig, userConfig.dev.authConfig);
    else
      Object.assign(this.config, (<any>Config).dev.authConfig);

    if (userConfig.dev && userConfig.dev.server)
      Object.assign(this.config, (<any>Config).dev.server, userConfig.dev.server);
    else
      Object.assign(this.config, (<any>Config).dev.server);

    this.config.database = <IDatabaseConnection>{ databases: [] };
    if (userConfig.dev && userConfig.dev.database) {
      this.config.database.host = userConfig.dev.database.host || (<any>Config).dev.database.host;
      this.config.database.port = userConfig.dev.database.port || (<any>Config).dev.database.port;
      this.config.database.username = userConfig.dev.database.username || (<any>Config).dev.database.username;
      this.config.database.password = userConfig.dev.database.password || (<any>Config).dev.database.password;

      if (userConfig.dev.database.databases)
        for (let i = 0; i < userConfig.dev.database.databases.length; i++)
          Object.assign(
            this.config.database.databases![i] = <any>{},
            (<any>Config).dev.database.databases[0],
            userConfig.dev.database.databases[i]
          );
      else
        Object.assign(this.config.database.databases![0], (<any>Config).dev.database.databases[0]);

    } else {
      this.config.database.host = (<any>Config).dev.database.host;
      this.config.database.port = (<any>Config).dev.database.port;
      this.config.database.username = (<any>Config).dev.database.username;
      this.config.database.password = (<any>Config).dev.database.password;
      Object.assign(this.config.database.databases![0], (<any>Config).dev.database.databases[0]);
    }

    if (this.env === 'production') {
      userConfig.prod = userConfig.prod || {};

      if (userConfig.prod && userConfig.prod.authConfig)
        Object.assign(this.config, userConfig.prod.authConfig);

      if (userConfig.prod && userConfig.prod.server)
        Object.assign(this.config, Config.prod!.server, userConfig.prod.server);
      else
        Object.assign(this.config, Config.prod!.server);

      if (userConfig.prod && userConfig.prod.database) {
        this.config.database.host = userConfig.prod.database.host || (<any>Config).prod.database.host;
        this.config.database.port = userConfig.prod.database.port || (<any>Config).prod.database.port;
        this.config.database.username = userConfig.prod.database.username || (<any>Config).prod.database.username;
        this.config.database.password = userConfig.prod.database.password || (<any>Config).prod.database.password;

        if (userConfig.prod.database.databases)
          for (let i = 0; i < userConfig.prod.database.databases.length; i++)
            Object.assign(this.config.database.databases![i], (<any>Config).prod.database.databases[0], userConfig.prod.database.databases[i]);
        else
          Object.assign(this.config.database.databases![0], (<any>Config).prod.database.databases[0]);

      } else {
        this.config.database.host = (<any>Config).prod.database.host;
        this.config.database.port = (<any>Config).prod.database.port;
        this.config.database.username = (<any>Config).prod.database.username;
        this.config.database.password = (<any>Config).prod.database.password;
        Object.assign(this.config.database.databases![0], (<any>Config).prod.database.databases[0]);
      }
    }

    if (this.config.services_prefix)
      this.config.services_prefix = '/' + stringUtil.cleanPath(this.config.services_prefix);

    this.config.files_data_dir = stringUtil.cleanPath(<string>this.config.files_data_dir);
  }
}

const State = new AppState();

export { State };