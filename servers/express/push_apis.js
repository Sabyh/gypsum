"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const types_1 = require("../../types");
const logger_1 = require("../../misc/logger");
const context_1 = require("../../context");
const state_1 = require("../../state");
function pushApis(app, appName = 'default', isSubDomain, spa = '', logger) {
    logger = logger || new logger_1.Logger(appName);
    logger.info('Implementing before middlwares for', appName, 'app..');
    if (state_1.State.middlewares && state_1.State.middlewares[appName] && state_1.State.middlewares[appName].before && state_1.State.middlewares[appName].before.length)
        for (let i = 0; i < state_1.State.middlewares[appName].before.length; i++)
            state_1.State.middlewares[appName].before[i](app);
    const router = express.Router();
    for (let i = 0; i < state_1.State.models.length; i++) {
        let model = state_1.State.models[i];
        let modelAppName = model.$get('app');
        if (isSubDomain) {
            if (modelAppName !== appName)
                continue;
        }
        else if (modelAppName !== appName) {
            if (state_1.State.apps.filter(app => (app.name === modelAppName && app.subdomain)).length > 0)
                continue;
        }
        if (model.$get('apiType') === types_1.API_TYPES.SOCKET)
            continue;
        let services = model.$getServices();
        for (let service in services) {
            if (services[service].apiType === types_1.API_TYPES.SOCKET)
                continue;
            logger.info(`adding service for ${appName} app: (${services[service].method}) - ${services[service].path}`);
            router[services[service].method](services[service].path, context_1.Context.Rest(model, services[service]));
        }
    }
    app.use(state_1.State.config.services_prefix, router);
    logger.info('Implementing after middlwares..');
    if (state_1.State.middlewares && state_1.State.middlewares[appName] && state_1.State.middlewares[appName].after && state_1.State.middlewares[appName].after.length)
        for (let i = 0; i < state_1.State.middlewares[appName].after.length; i++)
            state_1.State.middlewares[appName].after[i](app);
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
    if (spa && spa.trim())
        app.get('*', (req, res) => {
            res.sendFile(path.join(state_1.State.root, spa));
        });
}
exports.pushApis = pushApis;
//# sourceMappingURL=push_apis.js.map