import * as cluster from 'cluster';
import * as path from 'path';
import { Logger } from './misc/logger';

/**
 * import default config and Server state
 */
import { IServerConfigOptions, IGypsumConfig, IServerConfig, IGypsumConfigurations, IApp } from './config';
import { State } from './state';

/**
 * Pushing hooks to the server state
 */
import { hooks } from './hooks';
State.hooks.push(...hooks);

/**
 * Importing Models Constructors, Context and Decorators
 */
import { Model } from './models/model';
import { Context } from './context';

/**
 * Importing initializers
 */
import { initMongo } from './database/mongo';
import { initExpress } from './servers/express';
import { initSocket } from './servers/io';

/**
 * Importing Server
 */
import { Server } from './servers/http';
import { initializeWorkers } from './workers';
import { generateClientGypsum } from './client/generate-client-gypsum';
import { MongoModel, FileModel } from './models';
import { IModelHook, IHook } from './decorators';
import { App } from './app';

/**
 * Instanciating Logger for gypsum
 */
let logger: Logger;

function useHooks(hooks: ((ctx: Context) => void)[]) {
  for (let i = 0; i < hooks.length; i++)
    if (hooks[i] && hooks[i].name)
      State.hooks.push(hooks[i]);
}

export { IGypsumConfigurations };

export interface IGypsumUseOptions {
  models?: any[];
}

export interface IGypsumBootstrapOptions {
  config?: IGypsumConfigurations;
  apps?: typeof App[];
  middlewares?: Function;
  hooks?: ((ctx: Context, ...args: any[]) => void)[];
}

export interface IGypsum {
  root: string;
  env: string;
  dev: boolean;
  get: (name: keyof IServerConfigOptions) => any;
  set: <T extends keyof IServerConfigOptions, U extends IServerConfigOptions[T]>(name: T, value: U) => IGypsum;
  bootstrap: (options: IGypsumBootstrapOptions) => void;
}

export const Gypsum: IGypsum = {
  root: State.root,
  env: State.env,
  dev: State.env !== 'production',

  get(name: keyof (IServerConfigOptions)) {
    return State.config[name];
  },

  set<T extends keyof IServerConfigOptions, U extends IServerConfigOptions[T]>(name: T, value: U): IGypsum {
    State.config[name] = value;
    return this;
  },

  bootstrap(options: IGypsumBootstrapOptions): void {
    Logger.Info('Configuring Gypsum..');
    State.setConfiguration(options.config ? <IGypsumConfig>options.config : <IGypsumConfig>{});

    Logger.SetOptions(State.config.logger_options, State.config.logger_out_dir);
    logger = new Logger('gypsum');

    if (options.hooks) {
      logger.info('using hooks..');
      useHooks(options.hooks);
    }

    if (options.middlewares) {
      logger.info('using middlwares..');
      State.middlewares = options.middlewares;
    }

    if (State.config.processes !== 1 && cluster.isMaster) {
      initializeWorkers(State.config.processes);
      return;
    }

    logger.info('intializing apps');
    if (options.apps)
      for (let i = 0; i < options.apps.length; i++) {
        let app = new options.apps[i]()
        app.init();
        State.apps.push(app);
      }

    logger.info('generating gypsum-client.js');
    generateClientGypsum();

    logger.info('initializing mongodb...');
    try {
      initMongo()
        .then(db => {
          const server = new Server();

          logger.info('initializeing express...');
          initExpress(server.app);

          logger.info('initializeing socket...');
          initSocket(server.io);

          // TODO: pushing services map...

          logger.info('running server...');
          server.start();
        })
        .catch(error => logger.error(error));
    } catch (error) {
      logger.error(error);
    }
  }
}