"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const main_1 = require("../main");
const logger_1 = require("../misc/logger");
const state_1 = require("../state");
const types_1 = require("../types");
function gypsumBase64Upload(options) {
    const logger = new logger_1.Logger('base64Upload');
    options.uploadsDir = options.uploadsDir || 'uploads';
    options.uploadsPath = options.uploadsPath || `${state_1.State.config.origin}/${options.uploadsDir}`;
    function base64Upload(ctx, filePath, field, isUpdate) {
        let outDir = path.join(state_1.State.root, options.uploadsDir, filePath), data = ctx.body.data.indexOf('base64') > -1 ? ctx.body.data.split(',')[1] : ctx.body.data, fileName = `${Date.now()}.${ctx.body.fileType}`;
        filePath = `${options.uploadsPath}/${filePath}/${fileName}`;
        fs.writeFile(path.join(outDir, fileName), data, 'base64', err => {
            if (err) {
                console.log('error:', err);
                return ctx.next({
                    message: 'error writing file',
                    original: err,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                });
            }
            ctx.set(field || 'filePath', filePath);
            ctx.next();
        });
    }
    main_1.Gypsum.use({
        hooks: [base64Upload]
    });
}
exports.gypsumBase64Upload = gypsumBase64Upload;
//# sourceMappingURL=base64Upload.js.map