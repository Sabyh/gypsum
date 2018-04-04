import * as MongoDB from 'mongodb';
import * as Validall from 'validall';
import { CorsOptions } from 'cors';
import { API_TYPES, RESPONSE_DOMAINS } from '../types';
import { IHookOptions } from './hook';

export interface IModelOptions {
  secure?: any;
  authorize?: any;
  accessable?: boolean | string[];
  internal?: boolean;
  eliminate?: string[];
  apiType?: API_TYPES;
  domain?: RESPONSE_DOMAINS;
  before?: IHookOptions[];
  after?: IHookOptions[];
  schema?: Validall.ISchema;
  schemaOptions?: Validall.ISchemaOptions;
  indexes?: { name: string, options?: MongoDB.IndexOptions }[];
  cors?: CorsOptions;
}

const defaults: IModelOptions = {
  secure: false,
  authorize: false,
  accessable: true,
  internal: false,
  eliminate: [],
  apiType: API_TYPES.ALL,
  domain: 1,
  before: [],
  after: []
};

const defaultSchemaOptions: Validall.ISchemaOptions = {
  root: '',
  required: false,
  filter: false,
  strict: true,
  throwMode: false,
  traceError: false
};

export function MODEL(options: IModelOptions = {}) {

  return function (Target: any) {

    for (let prop in defaults)
      if ((<any>options)[prop] === undefined)
        (<any>options)[prop] = (<any>defaults)[prop];

    if (options.schema) {
      (<any>options.schema)['_id?'] = 'string';
      options.schemaOptions = Object.assign({}, defaultSchemaOptions, { root: Target.name }, options.schemaOptions || {});
      options.schema = new Validall.Schema(options.schema, options.schemaOptions);
    }

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


    for (let prop in options) {
      if (options.hasOwnProperty(prop))
        Object.defineProperty(Target.prototype, `__${prop}`, {
          get: function () { return options[<keyof IModelOptions>prop] },
          enumerable: true
        });
    }
  }
}