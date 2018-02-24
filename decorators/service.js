"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const util_1 = require("../util");
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
        let serviceName = util_1.stringUtil.capitalizeFirst(key);
        function service(ctx) {
            let args = [];
            if (options && options.args && options.args.length)
                for (let i = 0; i < options.args.length; i++)
                    args.push(util_1.objectUtil.getValue(ctx, options.args[i]));
            args.push(ctx);
            this[key](...args)
                .then((res) => {
                if (res)
                    ctx.ok(new types_1.Response(res));
                else
                    ctx.ok(new types_1.Response({ data: res }));
            })
                .catch((error) => ctx.next(error));
        }
        service.isService = true;
        service.__name = serviceName;
        service.secure = options && options.secure;
        service.authorize = options ? options.authorize : undefined;
        service.apiType = options && options.apiType ? options.apiType : types_1.API_TYPES.ALL;
        service.path = options && options.path ? options.path : '';
        service.event = options && options.event ? options.event : key;
        service.method = options && options.method ? options.method : (defaultOptions[key] ? defaultOptions[key].method : 'get');
        service.domain = options && options.domain ? options.domain : (defaultOptions[key] ? defaultOptions[key].domain : types_1.RESPONSE_DOMAINS.SELF);
        service.params = options && options.params ? options.params : (defaultOptions[key] ? defaultOptions[key].params || [] : []);
        service.before = options && options.before ? options.before : [];
        service.after = options && options.after ? options.after : [];
        service.validate = options ? options.validate : undefined;
        Object.defineProperty(target.constructor.prototype, serviceName, {
            value: service,
            enumerable: true
        });
    };
}
exports.SERVICE = SERVICE;
//# sourceMappingURL=service.js.map