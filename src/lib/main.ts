import * as cluster from 'cluster';
import * as path from 'path';
import * as Types from './types';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';

const safe = new Safe('main');

/**
 * import default config and Server state
 * applying user config on the default config
 */
import { IServerConfigOptions, IAuthenticationConfigOptions, IGypsumConfig } from './config';
import { State, IMiddlewares } from './state';

let userConfig = <IGypsumConfig>{};

try { userConfig = require(path.join(State.root, 'gypsum.config.json')); }
catch (e) { Logger.Warn('gypsum.config.json not found.. using default configuration'); }

State.setConfiguration(userConfig);

/**
 * Setting up Logger options
 */
Logger.SetOptions(State.config.logger_options);

/**
 * Pushing hooks to the server state
 */
import { hooks } from './hooks';
State.hooks.push(...hooks);

/**
 * Importing Models Constructors, Context and Decorators
 */
import { Model } from './model/model';
import { FileModel } from './model/file-model';
import { MongoModel } from './model/mongo-model';
import { Context } from './context';
import { SERVICE, HOOK, MODEL } from './decorators';

/**
 * Importing initializers
 */
import { initMongo } from './database/mongo';
import { initExpress } from './servers/express';
import { initSocket } from './servers/io';
import { initAuthentication } from './authentication';

/**
 * Importing Server
 */
import { Server } from './servers/http';
import { initializeWorkers } from './workers';

/**
 * Instanciating Logger for gypsum
 */
const logger = new Logger('gypsum');

function useHooks(hooks: ((ctx: Context) => void)[]) {
  for (let i = 0; i < hooks.length; i++)
    if (hooks[i] && hooks[i].name)
      State.hooks.push(hooks[i]);
}

function useMiddlewares(middlewares: IMiddlewares): void {
  State.middlewares = middlewares;
}

function useModels(models: typeof Model[]) {
  for (let i = 0; i < models.length; i++) {
    State.Models.push(models[i]);
  }
}

export namespace Gypsum {
  export interface IMakeOptions {
    models?: typeof Model[];
    middlewares?: IMiddlewares;
    hooks?: ((ctx: Context, ...args: any[]) => void)[];
  }
}

export const Gypsum = {
  root: State.root,
  env: State.env,
  dev: State.env !== 'production',

  get(name: keyof (IServerConfigOptions & IAuthenticationConfigOptions)): any {
    return State.config[name];
  },

  make(options: Gypsum.IMakeOptions): void {
    if (State.config.processes !== 1 && cluster.isMaster) {
      initializeWorkers(State.config.processes);
      return;
    }

    if (options.hooks)
      useHooks(options.hooks);
    if (options.middlewares)
      useMiddlewares(options.middlewares);
    if (options.models)
      useModels(options.models);
      
    if (State.config.authentication)
      initAuthentication();

    logger.info('instantiating Models...');
    for (let i = 0; i < State.Models.length; i++) {
      let model = new State.Models[i]();
      model[<'init'>safe.get('model.init')]();
      State.models.push(model);
    }

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
          server.start(State.config.port);
        })
        .catch(error => logger.error(error));
    } catch (error) {
      logger.error(error);
    }
  }
}

export { Model, MongoModel, FileModel, MODEL, SERVICE, HOOK, Context, Types };