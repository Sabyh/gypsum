import * as MongoDB from 'mongodb';
import * as Validall from 'validall';
import { CorsOptions } from 'cors';
import { API_TYPES, RESPONSE_DOMAINS } from '../types';
import { IHookOptions } from './hook';
import { IServiceOptions } from '.';

export interface IModelOptions {
  secure?: any;
  authorize?: any;
  private?: boolean | string[];
  internal?: boolean;
  servicesOptions?: { [key: string]: IServiceOptions };
  apiType?: API_TYPES;
  domain?: RESPONSE_DOMAINS;
  before?: IHookOptions[];
  after?: IHookOptions[];
  schema?: Validall.ISchema;
  indexes?: { name: string, options?: MongoDB.IndexOptions }[];
  cors?: CorsOptions;
}

const defaults: IModelOptions = {
  secure: false,
  authorize: false,
  private: false,
  internal: false,
  servicesOptions: {},
  apiType: API_TYPES.ALL,
  domain: 1,
  before: [],
  after: []
};

const schemaOptions: Validall.ISchemaOptions = {
  root: '',
  required: false,
  filter: true,
  strict: false,
  throwMode: false,
  traceError: false
};

export function MODEL(options: IModelOptions = {}) {

  return function (Target: any) {

    if (Target.__proto__.prototype) {
      let proto = Object.getOwnPropertyNames(Target.__proto__.prototype).slice(1);
      
      for (let i = 0; i < proto.length; i++) {
        let method = Target.__proto__.prototype[proto[i]];

        if (typeof method === 'function' && (method.isService || method.isHook)) {
          let attrs = Object.create(Target.prototype[proto[i]]);

          Target.prototype[proto[i]] = function (...args: any[]) {
            return method.apply(this, args);
          }

          for (var key in attrs)
            Target.prototype[proto[i]][key] = attrs[key];
          
        }
      }
    }

    for (let prop in defaults) {
      if ((<any>options)[prop] === undefined) {
        if (Target.prototype[`__${prop}`] === undefined)
          (<any>options)[prop] = (<any>defaults)[prop];
        else
          (<any>options)[prop] = Target.prototype[`__${prop}`];
      }
    }

    if (options.schema)
      options.schema = new Validall.Schema(options.schema, schemaOptions);
    

    for (let prop in options) {
      if (options.hasOwnProperty(prop))
        Object.defineProperty(Target.prototype, `__${prop}`, {
          get: function () { return options[<keyof IModelOptions>prop] },
          enumerable: true
        });
    }
  }
}