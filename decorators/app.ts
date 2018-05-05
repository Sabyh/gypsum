import { CorsOptions } from 'cors';
import { Model, MongoModel } from '../models';
import { State } from '../state';
import { objectUtil } from '../util';
import { API_TYPES } from '../types';

export interface IAppOptions {
  mongodb_url?: string;
  database_name?: string;
  namespaces?: string[];
  cors?: CorsOptions;
  apiType?: API_TYPES;
  models: (any)[];
}

export type IAppProdOptions = {
  [key in keyof IAppOptions]?: IAppOptions[key];
}

const defaultCors = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export type IAppKeys = keyof IAppOptions;

export function APP(options: { dev: IAppOptions, prod?: IAppProdOptions }) {

  if (State.env === 'production') {
    Object.assign(options.dev, options.prod || {});
  }

  return function (Target: any) {
    
    options.dev.apiType = options.dev.apiType || API_TYPES.ALL;
    options.dev.models = options.dev.models || [];
    options.dev.cors = objectUtil.extend(options.dev.cors || {}, defaultCors);

    for (let prop in options.dev) {
      if (options.dev.hasOwnProperty(prop)) {
        Object.defineProperty(Target.prototype, `__${prop}`, {
          get: function () { return options.dev[<keyof IAppOptions>prop] },
          enumerable: true
        });
      }
    }
  }
}