"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const defaultOptions = {
    find: { domain: types_1.RESPONSE_DOMAINS.SELF, method: 'get' },
    findById: { domain: types_1.RESPONSE_DOMAINS.SELF, method: 'get', params: ['id'] },
    findOne: { domain: types_1.RESPONSE_DOMAINS.SELF, method: 'get' },
    count: { domain: types_1.RESPONSE_DOMAINS.SELF, method: 'get' },
    search: { domain: types_1.RESPONSE_DOMAINS.SELF, method: 'post' },
    insert: { domain: types_1.RESPONSE_DOMAINS.ALL, method: 'post' },
    update: { domain: types_1.RESPONSE_DOMAINS.ALL, method: 'put' },
    updateById: { domain: types_1.RESPONSE_DOMAINS.ALL, method: 'put', params: ['id'] },
    updateOne: { domain: types_1.RESPONSE_DOMAINS.ALL, method: 'put' },
    delete: { domain: types_1.RESPONSE_DOMAINS.ALL, method: 'delete' },
    deleteById: { domain: types_1.RESPONSE_DOMAINS.ALL, method: 'delete', params: ['id'] },
    deleteOne: { domain: types_1.RESPONSE_DOMAINS.ALL, method: 'delete' },
};
function SERVICE(options) {
    return function (target, key, descriptor) {
        descriptor.enumerable = true;
        descriptor.value.isService = options ? !options.internal : true;
        descriptor.value.internal = options ? options.internal : false;
        descriptor.value.secure = options && options.secure;
        descriptor.value.authorize = options ? options.authorize : undefined;
        descriptor.value.apiType = options && options.apiType ? options.apiType : types_1.API_TYPES.ALL;
        descriptor.value.path = options && options.path ? options.path : '';
        descriptor.value.event = options && options.event ? options.event : key;
        descriptor.value.method = options && options.method ? options.method : (defaultOptions[key] ? defaultOptions[key].method : 'get');
        descriptor.value.domain = options && options.domain ? options.domain : (defaultOptions[key] ? defaultOptions[key].domain : types_1.RESPONSE_DOMAINS.SELF);
        descriptor.value.params = options && options.params ? options.params : (defaultOptions[key] ? defaultOptions[key].params || [] : []);
        descriptor.value.before = options && options.before ? options.before : [];
        descriptor.value.after = options && options.after ? options.after : [];
        descriptor.value.validate = options ? options.validate : undefined;
        Object.defineProperty(target.constructor.prototype, key, descriptor);
    };
}
exports.SERVICE = SERVICE;
//# sourceMappingURL=service.js.map