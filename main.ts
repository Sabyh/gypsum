import * as cluster from 'cluster';
import * as path from 'path';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';

const safe = new Safe('main');

/**
 * import default config and Server state
 */
import { IServerConfigOptions, IAuthenticationConfigOptions, IGypsumConfigurations } from './config';
import { State, IMiddlewares } from './state';

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
import { initAuthentication } from './authentication';

/**
 * Importing Server
 */
import { Server } from './servers/http';
import { initializeWorkers } from './workers';

/**
 * Instanciating Logger for gypsum
 */
let logger: Logger;

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

export { IGypsumConfigurations };

export interface IGypsumUseOptions {
  models?: any[];
  middlewares?: IMiddlewares;
  hooks?: ((ctx: Context, ...args: any[]) => void)[];
}

export interface IGypsum {
  root: string;
  env: string;
  dev: boolean;
  get: (name: keyof (IServerConfigOptions & IAuthenticationConfigOptions)) => any;
  configure: (userConfig?: IGypsumConfigurations) => IGypsum;
  use: (options: IGypsumUseOptions) => IGypsum;
  bootstrap: () => void;
}

export const Gypsum: IGypsum = {
  root: State.root,
  env: State.env,
  dev: State.env !== 'production',

  get(name: keyof (IServerConfigOptions & IAuthenticationConfigOptions)) {
    return State.config[name];
  },

  configure(userConfig: IGypsumConfigurations): IGypsum {
    /**
     * applying user config on the default config
     */
    State.setConfiguration(userConfig ? <any>userConfig : {});

    /**
     * Setting up Logger options
     */
    Logger.SetOptions(State.config.logger_options);
    logger = new Logger('gypsum');

    return this;
  },

  use(options: IGypsumUseOptions) {
    if (options.hooks)
      useHooks(options.hooks);
    if (options.middlewares)
      useMiddlewares(options.middlewares);
    if (options.models)
      useModels(options.models);

    return this;
  },

  bootstrap(): void {
    if (State.config.processes !== 1 && cluster.isMaster) {
      initializeWorkers(State.config.processes);
      return;
    }

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