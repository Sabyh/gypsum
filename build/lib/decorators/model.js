"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validall = require("validall");
const types_1 = require("../types");
const defaults = {
    secure: false,
    authorize: false,
    accessable: true,
    internal: false,
    eliminate: [],
    apiType: types_1.API_TYPES.ALL,
    domain: 0,
    before: [],
    after: []
};
const defaultSchemaOptions = {
    root: '',
    required: false,
    filter: false,
    strict: true,
    throwMode: false,
    traceError: false
};
function MODEL(options = {}) {
    return function (Target) {
        for (let prop in defaults)
            if (options[prop] === undefined)
                options[prop] = defaults[prop];
        if (options.schema) {
            if (!(options.schema instanceof Validall.Schema)) {
                options.schemaOptions = Object.assign({}, defaultSchemaOptions, { root: Target.name }, options.schemaOptions || {});
                options.schema = Object.assign(options.schema, { '_id?': 'string' });
                options.schema = new Validall.Schema({ $cast: 'array', $each: options.schema }, options.schemaOptions);
            }
            else {
                options.schema.schema['_id?'] = 'string';
            }
        }
        for (let prop in options) {
            if (options.hasOwnProperty(prop))
                Object.defineProperty(Target.prototype, `__${prop}`, {
                    get: function () { return options[prop]; },
                    enumerable: true
                });
        }
    };
}
exports.MODEL = MODEL;
//# sourceMappingURL=model.js.map