"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_1 = require("../util/object");
const logger_1 = require("../misc/logger");
function filter(ctx, fields, source) {
    const logger = new logger_1.Logger('filterHook');
    let srcData;
    logger.debug('fields passed', fields);
    if (!fields || !fields.length)
        ctx.next();
    fields = Array.isArray(fields) ? fields : [fields];
    logger.info('checking source data');
    if (source === 'query' || source === 'body')
        srcData = ctx[source];
    else
        srcData = ctx.getResponseData();
    if (!srcData || typeof srcData !== 'object')
        return ctx.next();
    logger.info('source data check passed');
    logger.info('checking filter method');
    let method = 'pick';
    if (fields[0].charAt(0) === '-') {
        method = 'omit';
        fields[0] = fields[0].slice(1);
    }
    logger.info(`method: ${method}`);
    logger.info('filtering data');
    if (Array.isArray(srcData))
        for (let i = 0; i < srcData.length; i++)
            srcData[i] = object_1.objectUtil[method](srcData, fields);
    else
        srcData = object_1.objectUtil[method](srcData, fields);
    logger.info('done filtering');
    logger.debug(`result data:`, JSON.stringify(srcData, null, 2));
    ctx.ok(srcData);
}
exports.filter = filter;
//# sourceMappingURL=filter.js.map