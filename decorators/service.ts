import * as Validall from 'validall';
import { CorsOptions } from 'cors';
import { RESPONSE_DOMAINS, API_TYPES, Response, ResponseError, IResponse } from '../types';
import { IHookOptions } from './hook';
import { stringUtil, objectUtil } from '../util';
import { Context } from '../context';

export interface IService {
  isService: boolean;
  __name: string;
  secure: boolean;
  authorize: boolean | string[];
  args: string[];
  name: string;
  method: "get" | "post" | "put" | "delete";
  apiType: API_TYPES;
  domain: RESPONSE_DOMAINS;
  path: string;
  event: string;
  params: string[];
  before: IHookOptions[];
  after: IHookOptions[];
  validate: { query?: Validall.ISchema, body?: Validall.ISchema, user?: Validall.ISchema }
  cors: CorsOptions;
}

export interface IValidateOptions {
  query?: Validall.ISchema;
  body?: Validall.ISchema;
  user?: Validall.ISchema;
  params?: Validall.ISchema;
}

export interface IServiceOptions {
  args?: string[];
  secure?: any;
  authorize?: any;
  method?: "get" | "post" | "put" | "delete" | "patch" | "options" | "head";
  apiType?: API_TYPES;
  domain?: RESPONSE_DOMAINS;
  params?: string[];
  before?: IHookOptions[];
  after?: IHookOptions[];
  validate?: IValidateOptions | { $or: IValidateOptions[] } | { $and: IValidateOptions[] } | { $nor: IValidateOptions[] } | { $xor: IValidateOptions[] };
  cors?: CorsOptions;
}

const defaultOptions: { [key: string]: IServiceOptions } = {
  find: { domain: RESPONSE_DOMAINS.SELF, method: 'get' },
  findById: { domain: RESPONSE_DOMAINS.SELF, method: 'get', params: ['id'] },
  findOne: { domain: RESPONSE_DOMAINS.SELF, method: 'get' },
  count: { domain: RESPONSE_DOMAINS.SELF, method: 'get' },
  search: { domain: RESPONSE_DOMAINS.SELF, method: 'post' },
  insert: { domain: RESPONSE_DOMAINS.ALL, method: 'post' },
  insertOne: { domain: RESPONSE_DOMAINS.ALL, method: 'post' },
  update: { domain: RESPONSE_DOMAINS.ALL, method: 'put' },
  updateById: { domain: RESPONSE_DOMAINS.ALL, method: 'put', params: ['id'] },
  updateOne: { domain: RESPONSE_DOMAINS.ALL, method: 'put' },
  delete: { domain: RESPONSE_DOMAINS.ALL, method: 'delete' },
  deleteById: { domain: RESPONSE_DOMAINS.ALL, method: 'delete', params: ['id'] },
  deleteOne: { domain: RESPONSE_DOMAINS.ALL, method: 'delete' },
};

export function SERVICE(options?: IServiceOptions) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let serviceName = stringUtil.capitalizeFirst(key);
    
    function service(ctx: Context) {
      let args = [];

      if (options && options.args && options.args.length)
        for (let i = 0; i < options.args.length; i++)
          args.push(objectUtil.getValue(ctx, options.args[i]));

      args.push(ctx);

      this.$logger.info(`running ${this.name}.${key} service...`);
      
      this[key](...args)
        .then((res: IResponse) => {
          if (res)
            ctx.ok(new Response(res));
          else
            ctx.ok(new Response({ data: res }));
        })
        .catch((error: ResponseError) => ctx.next(error));
    }

    (<any>service).isService = true;
    (<any>service).__name = serviceName;
    (<IServiceOptions>service).secure = options && options.secure;
    (<IServiceOptions>service).authorize = options ? options.authorize : undefined;
    (<IServiceOptions>service).apiType = options && options.apiType ? options.apiType : API_TYPES.ALL;
    (<IServiceOptions>service).method = options && options.method ? options.method : (defaultOptions[key] ? defaultOptions[key].method : 'get');
    (<IServiceOptions>service).domain = options && options.domain ? options.domain : (defaultOptions[key] ? defaultOptions[key].domain : RESPONSE_DOMAINS.SELF);
    (<IServiceOptions>service).params = options && options.params ? options.params : (defaultOptions[key] ? defaultOptions[key].params || [] : []);
    (<IServiceOptions>service).before = options && options.before ? options.before : [];
    (<IServiceOptions>service).after = options && options.after ? options.after : [];
    (<IServiceOptions>service).validate = options ? options.validate : undefined;

    Object.defineProperty(target.constructor.prototype, serviceName, {
      value: service,
      enumerable: true
    });
  }
}