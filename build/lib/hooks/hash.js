"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypt_1 = require("../util/crypt");
const object_1 = require("../util/object");
const logger_1 = require("../misc/logger");
const types_1 = require("../types");
const defaultOptions = {
    fieldPath: 'password',
    savePath: 'password',
    saltSavePath: '',
    source: 'body'
};
function hash(ctx, options) {
    const logger = new logger_1.Logger('hashHook');
    let srcData;
    let fieldValue;
    options = Object.assign({}, defaultOptions, options);
    options.saltSavePath = options.saltSavePath || `${options.savePath}Salt`;
    if (options.source === 'query' || options.source === 'body')
        srcData = ctx[options.source];
    else
        srcData = ctx.getResponseData();
    fieldValue = object_1.objectUtil.getValue(srcData, options.fieldPath);
    if (!fieldValue || typeof fieldValue !== 'string')
        return ctx.next({
            message: `${options.fieldPath} must have a string value`,
            code: types_1.RESPONSE_CODES.BAD_REQUEST
        });
    logger.info('collecting data');
    if (!srcData || !srcData[options.fieldPath])
        return ctx.next();
    logger.debug(options.fieldPath, 'has value of:', ctx.body[options.fieldPath]);
    logger.info('incrypting', options.fieldPath);
    crypt_1.hash(srcData[options.fieldPath])
        .then(results => {
        logger.info('incrypting passed');
        logger.debug('saving', options.fieldPath, 'in', options.savePath);
        object_1.objectUtil.injectValue(srcData, options.savePath, results[0]);
        logger.debug('saving', options.fieldPath, 'in', options.savePath + 'Salt');
        object_1.objectUtil.injectValue(srcData, options.saltSavePath, results[1]);
        ctx.next();
    })
        .catch(error => ctx.next({
        message: `error hashing '${options.fieldPath}'`,
        original: error,
        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
    }));
}
exports.hash = hash;
//# sourceMappingURL=hash.js.map