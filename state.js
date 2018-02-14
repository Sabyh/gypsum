"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const config_1 = require("./config");
const string_1 = require("./util/string");
const friend_1 = require("./decorators/friend");
const safe_1 = require("./misc/safe");
const logger_1 = require("./misc/logger");
let safe = new safe_1.Safe('state');
class AppState {
    constructor() {
        this._sockets = {};
        this.router = express.Router();
        this.root = process.cwd();
        this.env = process.env.NODE_ENV || 'developemt';
        this.config = {};
        this.models = [];
        this.Models = [];
        this.middlewares = { before: [], after: [] };
        this.hooks = [];
    }
    getModel(name) {
        return this.models.find(model => model.$get('name') === name) || undefined;
    }
    getHook(name) {
        return this.hooks.find(hook => hook.name === name) || undefined;
    }
    getSocket(id) {
        return this._sockets[id];
    }
    pushSocket(socket) {
        this._sockets[socket.id] = socket;
    }
    deleteSocket(id) {
        logger_1.Logger.Info('Deleting socket from server state with id:', id);
        delete this._sockets[id];
    }
    setConfiguration(userConfig = {}) {
        if (userConfig.dev && userConfig.dev.authConfig)
            Object.assign(this.config, config_1.Config.dev.authConfig, userConfig.dev.authConfig);
        else
            Object.assign(this.config, config_1.Config.dev.authConfig);
        if (userConfig.dev && userConfig.dev.server)
            Object.assign(this.config, config_1.Config.dev.server, userConfig.dev.server);
        else
            Object.assign(this.config, config_1.Config.dev.server);
        this.config.database = { databases: [] };
        if (userConfig.dev && userConfig.dev.database) {
            this.config.database.host = userConfig.dev.database.host || config_1.Config.dev.database.host;
            this.config.database.port = userConfig.dev.database.port || config_1.Config.dev.database.port;
            this.config.database.username = userConfig.dev.database.username || config_1.Config.dev.database.username;
            this.config.database.password = userConfig.dev.database.password || config_1.Config.dev.database.password;
            if (userConfig.dev.database.databases)
                for (let i = 0; i < userConfig.dev.database.databases.length; i++)
                    Object.assign(this.config.database.databases[i] = {}, config_1.Config.dev.database.databases[0], userConfig.dev.database.databases[i]);
            else
                Object.assign(this.config.database.databases[0], config_1.Config.dev.database.databases[0]);
        }
        else {
            this.config.database.host = config_1.Config.dev.database.host;
            this.config.database.port = config_1.Config.dev.database.port;
            this.config.database.username = config_1.Config.dev.database.username;
            this.config.database.password = config_1.Config.dev.database.password;
            Object.assign(this.config.database.databases[0], config_1.Config.dev.database.databases[0]);
        }
        if (this.env === 'production') {
            userConfig.prod = userConfig.prod || {};
            if (userConfig.prod && userConfig.prod.authConfig)
                Object.assign(this.config, userConfig.prod.authConfig);
            if (userConfig.prod && userConfig.prod.server)
                Object.assign(this.config, config_1.Config.prod.server, userConfig.prod.server);
            else
                Object.assign(this.config, config_1.Config.prod.server);
            if (userConfig.prod && userConfig.prod.database) {
                this.config.database.host = userConfig.prod.database.host || config_1.Config.prod.database.host;
                this.config.database.port = userConfig.prod.database.port || config_1.Config.prod.database.port;
                this.config.database.username = userConfig.prod.database.username || config_1.Config.prod.database.username;
                this.config.database.password = userConfig.prod.database.password || config_1.Config.prod.database.password;
                if (userConfig.prod.database.databases)
                    for (let i = 0; i < userConfig.prod.database.databases.length; i++)
                        Object.assign(this.config.database.databases[i], config_1.Config.prod.database.databases[0], userConfig.prod.database.databases[i]);
                else
                    Object.assign(this.config.database.databases[0], config_1.Config.prod.database.databases[0]);
            }
            else {
                this.config.database.host = config_1.Config.prod.database.host;
                this.config.database.port = config_1.Config.prod.database.port;
                this.config.database.username = config_1.Config.prod.database.username;
                this.config.database.password = config_1.Config.prod.database.password;
                Object.assign(this.config.database.databases[0], config_1.Config.prod.database.databases[0]);
            }
        }
        if (this.config.services_prefix)
            this.config.services_prefix = '/' + string_1.stringUtil.cleanPath(this.config.services_prefix);
        this.config.files_data_dir = string_1.stringUtil.cleanPath(this.config.files_data_dir);
    }
}
__decorate([
    friend_1.FRIEND(safe.set('State._io', ['ioServer', 'context']), true, true)
], AppState.prototype, "_io", void 0);
exports.AppState = AppState;
const State = new AppState();
exports.State = State;
//# sourceMappingURL=state.js.map