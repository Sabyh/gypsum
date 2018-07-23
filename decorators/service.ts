import * as Validall from 'validall';
import { capitalizeFirst } from 'tools-box/string';
import { getValue } from 'tools-box/object';
import { CorsOptions } from 'cors';
import { RESPONSE_DOMAINS, API_TYPES, Response, ResponseError, IResponse } from '../types';
import { IHookOptions } from './hook';
import { Context } from '../context';

export interface IValidateOptions {
  query?: Validall.ISchema;
  body?: Validall.ISchema;
  user?: Validall.ISchema;
  params?: Validall.ISchema;
}

export interface IService {
  isService: boolean;
  __name: string;
  secure: any;
  authorize: any;
  args: string[];
  name: string;
  method: "get" | "post" | "put" | "delete" | "patch" | "options" | "head";
  crud: "create" | "read" | "update" | "delete";
  apiType: API_TYPES;
  domain: RESPONSE_DOMAINS;
  path: string;
  event: string;
  params: string[];
  before: IHookOptions[];
  after: IHookOptions[];
  validate: IValidateOptions | { $or: IValidateOptions[] } | { $and: IValidateOptions[] } | { $nor: IValidateOptions[] } | { $xor: IValidateOptions[] }
  cors: CorsOptions;
}

export interface IServiceOptions {
  args?: string[];
  secure?: any;
  authorize?: any;
  method?: "get" | "post" | "put" | "delete" | "patch" | "options" | "head";
  crud?: "create" | "read" | "update" | "delete";
  apiType?: API_TYPES;
  domain?: RESPONSE_DOMAINS;
  params?: string[];
  before?: IHookOptions[];
  after?: IHookOptions[];
  validate?: IValidateOptions | { $or: IValidateOptions[] } | { $and: IValidateOptions[] } | { $nor: IValidateOptions[] } | { $xor: IValidateOptions[] };
  cors?: CorsOptions;
}

const defaultOptions: { [key: string]: IServiceOptions } = {
  find: { domain: RESPONSE_DOMAINS.SELF, method: 'get', crud: 'read' },
  findById: { domain: RESPONSE_DOMAINS.SELF, method: 'get', crud: 'read', params: ['id'] },
  findOne: { domain: RESPONSE_DOMAINS.SELF, method: 'get', crud: 'read' },
  count: { domain: RESPONSE_DOMAINS.SELF, method: 'get', crud: 'read' },
  search: { domain: RESPONSE_DOMAINS.SELF, method: 'post', crud: 'read' },
  insert: { domain: RESPONSE_DOMAINS.ALL, method: 'post', crud: 'create' },
  insertOne: { domain: RESPONSE_DOMAINS.ALL, method: 'post', crud: 'create' },
  update: { domain: RESPONSE_DOMAINS.ALL, method: 'put', crud: 'update' },
  updateById: { domain: RESPONSE_DOMAINS.ALL, method: 'put', crud: 'update', params: ['id'] },
  updateOne: { domain: RESPONSE_DOMAINS.ALL, method: 'put', crud: 'update' },
  delete: { domain: RESPONSE_DOMAINS.ALL, method: 'delete', crud: 'delete' },
  deleteById: { domain: RESPONSE_DOMAINS.ALL, method: 'delete', crud: 'delete', params: ['id'] },
  deleteOne: { domain: RESPONSE_DOMAINS.ALL, method: 'delete', crud: 'delete' }
};

export function SERVICE(options?: IServiceOptions) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let serviceName = capitalizeFirst(key);
    
    function service(ctx: Context) {
      let args = [];

      if (options && options.args && options.args.length)
        for (let i = 0; i < options.args.length; i++)
          args.push(getValue(ctx, options.args[i]));

      args.push(ctx);
      
      this[key](...args)
        .then((res: IResponse) => {
          let response: Response;

          if (res) {
            if (res instanceof Response)
              response = res;
            else if (res.data)
              response = new Response(res);
            else
              response = new Response({ data: res });
          } else {
            response = new Response({ data: true });
          }

          ctx.ok(response);
        })
        .catch((error: ResponseError) => ctx.next(error));
    }

    (<any>service).isService = true;
    (<any>service).__name = serviceName;
    (<IServiceOptions>service).secure = options ? options.secure : undefined;
    (<IServiceOptions>service).authorize = options ? options.authorize : undefined;
    (<IServiceOptions>service).apiType = options && options.apiType ? options.apiType : API_TYPES.ALL;
    (<IServiceOptions>service).method = options && options.method ? options.method : (defaultOptions[key] ? defaultOptions[key].method : 'get');
    (<IServiceOptions>service).crud = options && options.crud ? options.crud : (defaultOptions[key] ? defaultOptions[key].crud : getCrud((<IServiceOptions>service).method));
    (<IServiceOptions>service).domain = options && options.domain ? options.domain : (defaultOptions[key] ? defaultOptions[key].domain : RESPONSE_DOMAINS.SELF);
    (<IServiceOptions>service).params = options && options.params ? options.params : (defaultOptions[key] ? defaultOptions[key].params || [] : []);
    (<IServiceOptions>service).before = options && options.before ? options.before : [];
    (<IServiceOptions>service).after = options && options.after ? options.after : [];
    (<IServiceOptions>service).validate = options ? options.validate : undefined;

    Object.defineProperty(target.constructor.prototype, serviceName, {
      value: service,
      writable: true,
      enumerable: true
    });
  }
}

function getCrud(method: string) {
  if (method === 'post')
    return 'create';
  
  if (method === 'put')
    return 'update';

  if (method === 'delete')
    return 'delete';

  return 'read';
}