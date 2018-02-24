"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const Multer = require("multer");
const main_1 = require("../main");
const logger_1 = require("../misc/logger");
const state_1 = require("../state");
function gypsumMulter(config) {
    const logger = new logger_1.Logger('multer');
    config.uploadsDir = config.uploadsDir || 'uploads';
    config.uploadsURL = config.uploadsURL || `${state_1.State.config.origin}/${config.uploadsDir}`;
    const storage = Multer.diskStorage({
        destination: path.join(state_1.State.root, config.uploadsDir || 'uploads'),
        filename: (req, file, callback) => {
            callback(null, `${Date.now()}.${file.mimetype.split('/')[1]}`);
        }
    });
    function multer(ctx, type, options, limits) {
        if (!ctx._req || !ctx._res)
            return ctx.next();
        if (config.limits)
            limits = Object.assign({}, config.limits, limits);
        if (type === 'single' && typeof options === 'string') {
            ctx.nextHook(multerUploadPaths, [type, options]);
            Multer({ storage: storage, limits: limits }).single(options)(ctx._req, ctx._res, ctx.next);
        }
        else if (type === 'array' && options) {
            if (typeof options === 'string')
                options = { name: options, maxCount: config.maxUploadCount };
            else
                options = { name: options.name, maxCount: options.maxCount || config.maxUploadCount };
            ctx.nextHook(multerUploadPaths, [type, options]);
            Multer({ storage: storage, limits: limits }).array(options.name, options.maxCount)(ctx._req, ctx._res, ctx.next);
        }
        else if (type === 'fields' && Array.isArray(options)) {
            options = options.map(option => ({ name: option.name, maxCount: option.maxCount || config.maxUploadCount }));
            ctx.nextHook(multerUploadPaths, [type, options]);
            Multer({ storage: storage, limits: limits }).fields(options)(ctx._req, ctx._res, ctx.next);
        }
        else {
            logger.warn('invalid multer hook options');
        }
        ctx.next();
    }
    function multerUploadPaths(ctx, type, options) {
        if (!ctx._req)
            return ctx.next();
        let filePath;
        let filesPaths;
        if (type === 'single') {
            filePath = `${config.uploadsURL}/${options}/${ctx._req.file.filename}`;
            ctx.set('filePath', filePath);
        }
        else if (type === 'array') {
            filesPaths = ctx._req.files.map(file => {
                return `${config.uploadsURL}/${options.name}/${file.filename}`;
            });
            ctx.set('filesPaths', filesPaths);
        }
        else {
            filesPaths = {};
            for (let prop in options) {
                filesPaths[prop] = ctx._req.files[prop].map((file) => {
                    return `${config.uploadsURL}/${prop}/${file.filename}`;
                });
            }
            ctx.set('filesPaths', filesPaths);
        }
        ctx.next();
    }
    main_1.Gypsum.use({
        hooks: [multer]
    });
}
exports.gypsumMulter = gypsumMulter;
//# sourceMappingURL=multer.js.map