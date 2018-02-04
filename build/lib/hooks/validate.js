"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validall = require("validall");
const types_1 = require("../types");
const logger_1 = require("../misc/logger");
function validate(ctx, args) {
    const logger = new logger_1.Logger('validateHook');
    logger.info('checking args');
    logger.debug('args:', args);
    if (!args) {
        return ctx.next({
            message: 'invalid args',
            code: types_1.RESPONSE_CODES.BAD_REQUEST
        });
    }
    logger.info('args check passed');
    logger.info('looping args');
    for (let prop in args) {
        if (['query', 'body', 'user'].indexOf(prop) === -1)
            return ctx.next({
                message: `validating context.${prop} is not allowed`,
                code: types_1.RESPONSE_CODES.BAD_REQUEST
            });
        logger.info(`validating ${prop}`);
        if (!Validall(ctx[prop], args[prop], { root: prop, required: true })) {
            logger.info(`validating ${prop} faild`);
            logger.debug(`validation error`, Validall.error);
            return ctx.next({
                message: Validall.error.toString(),
                original: Validall.error,
                code: types_1.RESPONSE_CODES.UNAUTHORIZED
            });
        }
        logger.info(`validating ${prop} passed`);
    }
    logger.info('all validations passed');
    ctx.next();
}
exports.validate = validate;
//# sourceMappingURL=validate.js.map