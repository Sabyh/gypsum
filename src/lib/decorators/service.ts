import { RESPONSE_DOMAINS, API_TYPES, IServiceOptions } from '../types';

const defaultOptions: { [key: string]: IServiceOptions } = {
  find: { domain: RESPONSE_DOMAINS.SELF, method: 'get' },
  findById: { domain: RESPONSE_DOMAINS.SELF, method: 'get', params: ['id']},
  findOne: { domain: RESPONSE_DOMAINS.SELF, method: 'get'},
  count: { domain: RESPONSE_DOMAINS.SELF, method: 'get'},
  search: { domain: RESPONSE_DOMAINS.SELF, method: 'post'},
  insert: { domain: RESPONSE_DOMAINS.ALL, method: 'post'},
  update: { domain: RESPONSE_DOMAINS.ALL, method: 'put'},
  updateById: { domain: RESPONSE_DOMAINS.ALL, method: 'put', params: ['id']},
  updateOne: { domain: RESPONSE_DOMAINS.ALL, method: 'put'},
  delete: { domain: RESPONSE_DOMAINS.ALL, method: 'delete'},
  deleteById: { domain: RESPONSE_DOMAINS.ALL, method: 'delete', params: ['id']},
  deleteOne: { domain: RESPONSE_DOMAINS.ALL, method: 'delete'},
};

export function SERVICE(options?: IServiceOptions) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = true;
    descriptor.value.isService = options ? !options.internal : true;
    descriptor.value.internal = options ? options.internal : false;
    descriptor.value.secure = options && options.secure;
    descriptor.value.authorize = options ? options.authorize : undefined;
    descriptor.value.apiType = options && options.apiType ? options.apiType : API_TYPES.ALL;
    descriptor.value.path = options && options.path ? options.path : '';
    descriptor.value.event = options && options.event ? options.event : key;
    descriptor.value.method = options && options.method ? options.method : (defaultOptions[key] ? defaultOptions[key].method : 'get');
    descriptor.value.domain = options && options.domain ? options.domain : (defaultOptions[key] ? defaultOptions[key].domain : RESPONSE_DOMAINS.SELF);
    descriptor.value.params = options && options.params ? options.params : (defaultOptions[key] ? defaultOptions[key].params || [] : []);
    descriptor.value.before = options && options.before ? options.before : [];
    descriptor.value.after = options && options.after ? options.after : [];
    descriptor.value.validate = options ? options.validate : undefined;

    Object.defineProperty(target.constructor.prototype, key, descriptor);
  }
}