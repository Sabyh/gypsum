"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Mongodb = require("mongodb");
const logger_1 = require("../misc/logger");
const util_1 = require("../util");
const state_1 = require("../state");
const types_1 = require("../types");
function reference(ctx, options) {
    const logger = new logger_1.Logger('referenceHook');
    if (!options) {
        logger.warn('options was not provided!');
        return ctx.next();
    }
    let response = ctx.getResponseData();
    if (!response) {
        logger.warn('undefined response!');
        return ctx.next();
    }
    let id = util_1.objectUtil.getValue(response, options.path);
    if (!id) {
        logger.warn(`'${options.path}' was not found in response data`);
        return ctx.next();
    }
    let model = state_1.State.getModel(options.model);
    if (!model) {
        logger.warn(`'${options.model}' was not found`);
        return ctx.next();
    }
    model.findOne({ _id: new Mongodb.ObjectID(id) })
        .then(res => {
        if (!res.data) {
            logger.warn(`${options.model} with reference '${id}' was not found`);
            ctx.next();
        }
        else {
            util_1.objectUtil.setValue(response, options.path, res.data);
            ctx.next();
        }
    })
        .catch(error => ctx.next({
        message: `error referencing ${options.model} with reference '${id}'`,
        original: error,
        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
    }));
}
exports.reference = reference;
//# sourceMappingURL=reference.js.map