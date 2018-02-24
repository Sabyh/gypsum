"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const logger_1 = require("../misc/logger");
const index_1 = require("../util/index");
function exists(ctx, model, field) {
    const logger = new logger_1.Logger('existsHook');
    if (!field)
        return ctx.next({
            message: `existsHook: field name should be specified`,
            code: types_1.RESPONSE_CODES.BAD_REQUEST
        });
    logger.info(`checking ${field} value`);
    let fieldValue = index_1.objectUtil.getValue(ctx.body, field);
    if (!fieldValue)
        return ctx.next({
            message: `existsHook: '${field}' is required`,
            code: types_1.RESPONSE_CODES.BAD_REQUEST
        });
    logger.info(`${field} value check passed`);
    const query = { [field]: fieldValue };
    logger.info(`checking model`);
    if (!model)
        ctx.next({
            message: `existsHook: undefined model`,
            code: types_1.RESPONSE_CODES.BAD_REQUEST
        });
    logger.info(`model check passed`);
    logger.info(`counting documents`);
    try {
        model.count(query)
            .then(res => {
            logger.info(`counting results: ${res.data}`);
            if (res.data) {
                logger.info(`document exists`);
                ctx.next({
                    message: `document with same ${field} already exists!`,
                    code: types_1.RESPONSE_CODES.BAD_REQUEST
                });
            }
            logger.info(`document exist check passed`);
            ctx.next();
        });
    }
    catch (error) {
        ctx.next({
            message: 'existsHook: error counting documents',
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        });
    }
}
exports.exists = exists;
//# sourceMappingURL=exists.js.map