"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster = require("cluster");
const safe_1 = require("./misc/safe");
const logger_1 = require("./misc/logger");
const safe = new safe_1.Safe('main');
const state_1 = require("./state");
const hooks_1 = require("./hooks");
state_1.State.hooks.push(...hooks_1.hooks);
const mongo_1 = require("./database/mongo");
const express_1 = require("./servers/express");
const io_1 = require("./servers/io");
const http_1 = require("./servers/http");
const workers_1 = require("./workers");
const generate_client_gypsum_1 = require("./client/generate-client-gypsum");
let logger;
function useHooks(hooks) {
    for (let i = 0; i < hooks.length; i++)
        if (hooks[i] && hooks[i].name)
            state_1.State.hooks.push(hooks[i]);
}
function useMiddlewares(middlewares) {
    for (let prop in middlewares) {
        if (state_1.State.middlewares[prop]) {
            if (middlewares[prop].before && middlewares[prop].before.length)
                if (state_1.State.middlewares[prop].before)
                    state_1.State.middlewares[prop].before.push(...middlewares[prop].before);
            if (middlewares[prop].after && middlewares[prop].after.length)
                if (state_1.State.middlewares[prop].after)
                    state_1.State.middlewares[prop].after.push(...middlewares[prop].after);
        }
        else {
            state_1.State.middlewares[prop] = { before: [], after: [] };
            if (middlewares[prop].before && middlewares[prop].before.length)
                state_1.State.middlewares[prop].before.push(...middlewares[prop].before);
            if (middlewares[prop].after && middlewares[prop].after.length)
                state_1.State.middlewares[prop].after.push(...middlewares[prop].after);
        }
    }
}
function useModels(models) {
    for (let i = 0; i < models.length; i++)
        state_1.State.Models.push(models[i]);
}
exports.Gypsum = {
    root: state_1.State.root,
    env: state_1.State.env,
    dev: state_1.State.env !== 'production',
    get(name) {
        return state_1.State.config[name];
    },
    set(name, value) {
        state_1.State.config[name] = value;
        return this;
    },
    getModel(name) {
        return state_1.State.getModel(name);
    },
    getModelConstructor(name) {
        return state_1.State.getModelConstructor(name);
    },
    getHook(name) {
        return state_1.State.getHook(name);
    },
    configure(userConfig) {
        logger_1.Logger.Info('Configuring Gypsum..');
        state_1.State.setConfiguration(userConfig ? userConfig : {});
        logger_1.Logger.SetOptions(state_1.State.config.logger_options);
        logger = new logger_1.Logger('gypsum');
        return this;
    },
    use(options) {
        if (options.hooks) {
            logger.info('using hooks..');
            useHooks(options.hooks);
        }
        if (options.middlewares) {
            logger.info('using middlwares..');
            useMiddlewares(options.middlewares);
        }
        if (options.models) {
            logger.info('using models..');
            useModels(options.models);
        }
        return this;
    },
    bootstrap() {
        if (Object.keys(state_1.State.config).length === 0)
            state_1.State.setConfiguration({});
        if (state_1.State.config.processes !== 1 && cluster.isMaster) {
            workers_1.initializeWorkers(state_1.State.config.processes);
            return;
        }
        logger.info('instantiating Models...');
        for (let i = 0; i < state_1.State.Models.length; i++) {
            let model = new state_1.State.Models[i]();
            model[safe.get('model.init')]();
            state_1.State.models.push(model);
        }
        logger.info('generating gypsum-client.js');
        generate_client_gypsum_1.generateClientGypsum();
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
                server.start();
            })
                .catch(error => logger.error(error));
        }
        catch (error) {
            logger.error(error);
        }
    }
};
//# sourceMappingURL=main.js.map