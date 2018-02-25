import * as cluster from 'cluster';
import * as path from 'path';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';

const safe = new Safe('main');

/**
 * import default config and Server state
 */
import { IServerConfigOptions, IGypsumConfigurations, IGypsumConfig } from './config';
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

/**
 * Importing Server
 */
import { Server } from './servers/http';
import { initializeWorkers } from './workers';
import { generateClientGypsum } from './client/generate-client-gypsum';
import { MongoModel, FileModel } from './models';
import { IModelHook, IHook } from './decorators';

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
  for (let prop in middlewares) {
    if (State.middlewares[prop]) {
      if (middlewares[prop].before && middlewares[prop].before.length)
        if (State.middlewares[prop].before)
          State.middlewares[prop].before.push(...middlewares[prop].before);

      if (middlewares[prop].after && middlewares[prop].after.length)
        if (State.middlewares[prop].after)
          State.middlewares[prop].after.push(...middlewares[prop].after);
    } else {
      State.middlewares[prop] = { before: [], after: [] };
      if (middlewares[prop].before && middlewares[prop].before.length)
        State.middlewares[prop].before.push(...middlewares[prop].before);

      if (middlewares[prop].after && middlewares[prop].after.length)
        State.middlewares[prop].after.push(...middlewares[prop].after);
    }
  }
}

function useModels(models: typeof Model[]) {
  for (let i = 0; i < models.length; i++)
    State.Models.push(models[i]);
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
  get: (name: keyof IServerConfigOptions) => any;
  set: <T extends keyof IServerConfigOptions, U extends IServerConfigOptions[T]>(name: T, value: U) => IGypsum;
  getModel: (name: string) => Model | MongoModel | FileModel | undefined;
  getModelConstructor: (name: string) => typeof Model | typeof MongoModel | typeof FileModel | undefined;
  getHook: (name: string) => IHook | undefined;
  configure: (userConfig?: IGypsumConfigurations) => IGypsum;
  use: (options: IGypsumUseOptions) => IGypsum;
  bootstrap: () => void;
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

  getModel(name: string): Model | MongoModel | FileModel | undefined {
    return State.getModel(name);
  },

  getModelConstructor(name: string): typeof Model | typeof MongoModel | typeof FileModel | undefined {
    return State.getModelConstructor(name);
  },

  getHook(name: string): IHook | undefined {
    return State.getHook(name);
  },

  configure(userConfig: IGypsumConfigurations): IGypsum {
    /**
     * applying user config on the default config
     */
    Logger.Info('Configuring Gypsum..');
    State.setConfiguration(userConfig ? <IGypsumConfig>userConfig : <IGypsumConfig>{});

    /**
     * Setting up Logger options
     */
    Logger.SetOptions(State.config.logger_options);
    logger = new Logger('gypsum');

    return this;
  },

  use(options: IGypsumUseOptions) {

    if (options.hooks) {
      logger.info('using hooks..');
      useHooks(options.hooks);
    }
    if (options.middlewares) {
      logger.info('using middlwares..');
      useMiddlewares(options.middlewares);
    }
    if (options.models) {
      logger.info('using models..');
      useModels(options.models);
    }

    return this;
  },

  bootstrap(): void {
    if (Object.keys(State.config).length === 0)
      State.setConfiguration(<IGypsumConfig>{});

    if (State.config.processes !== 1 && cluster.isMaster) {
      initializeWorkers(State.config.processes);
      return;
    }

    logger.info('instantiating Models...');
    for (let i = 0; i < State.Models.length; i++) {
      let model = new State.Models[i]();
      model[<'init'>safe.get('model.init')]();
      State.models.push(model);
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