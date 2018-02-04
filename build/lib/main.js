"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster = require("cluster");
const path = require("path");
const Types = require("./types");
exports.Types = Types;
const safe_1 = require("./misc/safe");
const logger_1 = require("./misc/logger");
const safe = new safe_1.Safe('main');
const state_1 = require("./state");
let userConfig = {};
try {
    userConfig = require(path.join(state_1.State.root, 'gypsum.config.json'));
}
catch (e) {
    logger_1.Logger.Warn('gypsum.config.json not found.. using default configuration');
}
state_1.State.setConfiguration(userConfig);
logger_1.Logger.SetOptions(state_1.State.config.logger_options);
const hooks_1 = require("./hooks");
state_1.State.hooks.push(...hooks_1.hooks);
const model_1 = require("./model/model");
exports.Model = model_1.Model;
const file_model_1 = require("./model/file-model");
exports.FileModel = file_model_1.FileModel;
const mongo_model_1 = require("./model/mongo-model");
exports.MongoModel = mongo_model_1.MongoModel;
const context_1 = require("./context");
exports.Context = context_1.Context;
const decorators_1 = require("./decorators");
exports.SERVICE = decorators_1.SERVICE;
exports.HOOK = decorators_1.HOOK;
exports.MODEL = decorators_1.MODEL;
const mongo_1 = require("./database/mongo");
const express_1 = require("./servers/express");
const io_1 = require("./servers/io");
const authentication_1 = require("./authentication");
const http_1 = require("./servers/http");
const workers_1 = require("./workers");
const logger = new logger_1.Logger('gypsum');
function useHooks(hooks) {
    for (let i = 0; i < hooks.length; i++)
        if (hooks[i] && hooks[i].name)
            state_1.State.hooks.push(hooks[i]);
}
function useMiddlewares(middlewares) {
    state_1.State.middlewares = middlewares;
}
function useModels(models) {
    for (let i = 0; i < models.length; i++) {
        state_1.State.Models.push(models[i]);
    }
}
exports.Gypsum = {
    root: state_1.State.root,
    env: state_1.State.env,
    dev: state_1.State.env !== 'production',
    get(name) {
        return state_1.State.config[name];
    },
    make(options) {
        if (state_1.State.config.processes !== 1 && cluster.isMaster) {
            workers_1.initializeWorkers(state_1.State.config.processes);
            return;
        }
        if (options.hooks)
            useHooks(options.hooks);
        if (options.middlewares)
            useMiddlewares(options.middlewares);
        if (options.models)
            useModels(options.models);
        if (state_1.State.config.authentication)
            authentication_1.initAuthentication();
        logger.info('instantiating Models...');
        for (let i = 0; i < state_1.State.Models.length; i++) {
            let model = new state_1.State.Models[i]();
            model[safe.get('model.init')]();
            state_1.State.models.push(model);
        }
        logger.info('initializing mongodb...');
        try {
            mongo_1.initMongo()
                .then(db => {
                const server = new http_1.Server();
                logger.info('initializeing express...');
                express_1.initExpress(server.app);
                logger.info('initializeing socket...');
                io_1.initSocket(server.io);
                logger.info('running server...');
                server.start(state_1.State.config.port);
            })
                .catch(error => logger.error(error));
        }
        catch (error) {
            logger.error(error);
        }
    }
};
//# sourceMappingURL=main.js.map