"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const compress = require("compression");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const state_1 = require("../state");
const types_1 = require("../types");
const context_1 = require("../context");
const logger_1 = require("../misc/logger");
const search_query_1 = require("../middlewares/search-query");
function initExpress(app) {
    const logger = new logger_1.Logger('express');
    app.use((req, res, next) => {
        logger.info(`request: ${req.method} - ${req.originalUrl}`);
        next();
    });
    logger.info('impliminting express middlewares..');
    if (state_1.State.env === 'production')
        app.use(compress());
    app.use(cookieParser(state_1.State.config.cookie_key));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json({ limit: `${state_1.State.config.upload_size_limit_mb}mb` }));
    app.use(methodOverride());
    app.use(search_query_1.searchQuery);
    app.disable('x-powered-by');
    logger.info('Implementing before middlwares..');
    if (state_1.State.middlewares.before.length)
        for (let i = 0; i < state_1.State.middlewares.before.length; i++)
            state_1.State.middlewares.before[i](app);
    logger.info('Implementing rest services..');
    if (state_1.State.models && state_1.State.models.length) {
        let models = state_1.State.models;
        for (let i = 0; i < models.length; i++) {
            let model = models[i];
            if (model.$get('apiType') === types_1.API_TYPES.SOCKET)
                continue;
            let services = model.$getServices();
            for (let service in services) {
                if (services[service].apiType === types_1.API_TYPES.SOCKET)
                    continue;
                logger.info(`adding service: (${services[service].method}) - ${services[service].path}`);
                state_1.State.router[services[service].method](services[service].path, context_1.Context.Rest(model, services[service]));
            }
        }
        app.use(state_1.State.config.services_prefix, state_1.State.router);
    }
    logger.info('Implementing statics..');
    if (state_1.State.config.statics && state_1.State.config.statics.length) {
        for (let i = 0; i < state_1.State.config.statics.length; i++) {
            let parts = state_1.State.config.statics[i].split(',');
            let fileName = parts[0];
            let prefix = parts[1] || '';
            logger.info(`static file path: '${path.join(state_1.State.root, fileName)}', static prefix: '${prefix}'`);
            app.use(prefix, express.static(path.join(state_1.State.root, fileName)));
        }
    }
    logger.info('Implementing after middlwares..');
    if (state_1.State.middlewares.after.length)
        for (let i = 0; i < state_1.State.middlewares.after.length; i++)
            state_1.State.middlewares.after[i](app);
    app.use((err, req, res, next) => {
        logger.error(err);
        console.trace(err);
        if (err) {
            res.status(types_1.RESPONSE_CODES.UNKNOWN_ERROR).json(new types_1.Response({
                data: new types_1.ResponseError({ message: 'unkown error', original: err, code: types_1.RESPONSE_CODES.UNKNOWN_ERROR })
            }));
        }
        else {
            res.status(types_1.RESPONSE_CODES.NOT_FOUND).json(new types_1.Response({
                data: new types_1.ResponseError({ message: '404 not found!', original: err, code: types_1.RESPONSE_CODES.NOT_FOUND })
            }));
        }
    });
}
exports.initExpress = initExpress;
//# sourceMappingURL=express.js.map