"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    let model = state_1.State.getModel(options.model);
    if (!model) {
        logger.warn(`'${options.model}' was not found`);
        return ctx.next();
    }
    let ids = [];
    if (Array.isArray(response) && response.length)
        for (let i = 0; i < response.length; i++) {
            let id = util_1.objectUtil.getValue(response[i], options.path);
            if (id)
                ids.push(id);
        }
    if (!ids.length) {
        logger.warn(`'${options.path}' was not found in response data`);
        return ctx.next();
    }
    model.find({ _id: { $in: ids } })
        .then(res => {
        if (!res.data) {
            logger.warn(`${options.model} references were not found`);
            ctx.next();
        }
        else {
            for (let i = 0; i < ids.length; i++)
                for (let j = 0; j < res.data.length; j++) {
                    if (ids[i] === res.data[j]._id)
                        util_1.objectUtil.setValue(response[i], options.path, res.data[j]);
                }
            ctx.next();
        }
    })
        .catch(error => ctx.next({
        message: `error referencing ${options.model} with references '${ids}'`,
        original: error,
        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
    }));
}
exports.reference = reference;
//# sourceMappingURL=reference.js.map