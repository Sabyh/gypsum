"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Moment = require("moment");
const validall_1 = require("validall");
const main_1 = require("../main");
const util_1 = require("../util");
const logger_1 = require("../misc/logger");
function gypsumMoment() {
    const logger = new logger_1.Logger('moment');
    function moment(ctx, ...fields) {
        if (!fields || !fields.length)
            return ctx.next();
        let response = ctx.getResponseData();
        if (!response || (response && !response.length))
            return ctx.next();
        let data = [];
        if (!Array.isArray(response))
            data.push(response);
        else
            data = response;
        for (let i = 0; i < data.length; i++) {
            for (let i = 0; i < fields.length; i++) {
                let field = Array.isArray(fields[i]) ? fields[i] : [fields[i]];
                let srcField = field[0];
                let destField = field[1] || field[0];
                let method = field[2] || field[1] || 'from';
                if (['form', 'fromNow'].indexOf(method) === -1)
                    method = 'from';
                if (srcField === '.' && typeof data[i] === 'string') {
                    data[i] = Moment()[method](data[i]);
                }
                else if (validall_1.Types.object(data[i])) {
                    let srcValue = util_1.objectUtil.getValue(data[i], srcField);
                    if (srcValue)
                        util_1.objectUtil.setValue(data[i], destField, Moment()[method](srcValue));
                    else
                        logger.warn(`cannot find '${srcField}' in the response object`);
                }
                else {
                    logger.warn(`input data does not match the response`);
                }
            }
        }
        ctx.setResponseData(data);
        ctx.next();
    }
    main_1.Gypsum.use({
        hooks: [moment]
    });
}
exports.gypsumMoment = gypsumMoment;
//# sourceMappingURL=moment.js.map