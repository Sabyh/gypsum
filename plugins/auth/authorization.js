"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../../models");
const decorators_1 = require("../../decorators");
const index_1 = require("../../types/index");
const index_2 = require("../../util/index");
const state_1 = require("../../state");
const logger_1 = require("../../misc/logger");
function initAuthorization(authConfig) {
    logger_1.Logger.Info('Initializing Authorization Layer...');
    state_1.State.config.authorizationModelName = 'Authorization';
    let Authorization = Authorization_1 = class Authorization extends models_1.Model {
        _mGetUserRolesFromGroups(id) {
            return new Promise((resolve, reject) => {
                this.groups.find({ users: { $in: [id] } })
                    .toArray()
                    .then(results => {
                    if (results && results.length)
                        resolve(results.reduce((prev, current) => {
                            return prev.push(...current.roles);
                        }, []));
                    else
                        resolve([]);
                });
            });
        }
        _mGetUserPermissionsFromRules(id, extraRules = []) {
            return new Promise((resolve, reject) => {
                this.roles.find({ $or: [{ users: { $in: [id] } }, { name: { $in: extraRules } }] })
                    .toArray()
                    .then(results => {
                    if (results && results.length) {
                        let permissions = [];
                        results.forEach(result => {
                            permissions.push(...result.permissions);
                        }, []);
                        resolve(permissions);
                    }
                    else
                        resolve([]);
                });
            });
        }
        authorize(options, ctx) {
            return new Promise((resolve, reject) => {
                if (!ctx.user)
                    return reject({
                        message: 'user not logged in',
                        code: index_1.RESPONSE_CODES.UNAUTHORIZED
                    });
                let modelName = ctx.model.$get('name').toLowerCase();
                let serviceName = ctx.service.name.toLowerCase();
                this._mGetUserRolesFromGroups(ctx.user._id)
                    .then(roles => this._mGetUserPermissionsFromRules(ctx.user._id, roles))
                    .then(permissions => {
                    if (permissions.length) {
                        for (let i = 0; i < permissions.length; i++) {
                            if ((permissions[i].model === '*' && permissions[i].services[0] === '*') ||
                                (permissions[i].model === '*' && permissions[i].services.indexOf(serviceName) > -1) ||
                                (permissions[i].model === modelName && permissions[i].services[0] === '*') ||
                                (permissions[i].model === modelName && permissions[i].services.indexOf(serviceName) > -1)) {
                                return resolve();
                            }
                        }
                    }
                    if (options !== true && Array.isArray(options)) {
                        for (let i = 0; i < options.length; i++) {
                            let option = options[i];
                            let parts = option.split(':');
                            let userField = parts.shift();
                            let contextPathArr = parts[0].split('.');
                            let contextField = contextPathArr.shift();
                            let contextSubField = contextPathArr.join('.');
                            if (!userField || !contextField || !contextSubField || ['query', 'body', 'params'].indexOf(contextField) === -1)
                                return reject({
                                    message: `${Authorization_1}: bad options provided: ${options}`,
                                    code: index_1.RESPONSE_CODES.BAD_REQUEST
                                });
                            let val01 = index_2.objectUtil.getValue(ctx.user, userField);
                            let val02 = index_2.objectUtil.getValue(ctx[contextField], contextSubField);
                            if (userField === '_id')
                                val01 = val01.toString();
                            if (val01 !== val02)
                                return reject({
                                    message: 'user not authorized',
                                    code: index_1.RESPONSE_CODES.UNAUTHORIZED
                                });
                        }
                        return resolve();
                    }
                    reject({
                        message: 'user not authorized',
                        code: index_1.RESPONSE_CODES.UNAUTHORIZED
                    });
                })
                    .catch(error => reject({
                    message: 'Error authorizing user',
                    original: error,
                    code: index_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            });
        }
    };
    __decorate([
        decorators_1.HOOK()
    ], Authorization.prototype, "authorize", null);
    Authorization = Authorization_1 = __decorate([
        decorators_1.MODEL()
    ], Authorization);
    let Permissions = class Permissions extends models_1.Model {
        find() {
            return new Promise((resolve, reject) => {
                let models = state_1.State.models;
                let result = [];
                for (let i = 0; i < models.length; i++) {
                    let modelName = models[i].$get('name');
                    let record = { model: modelName, services: [] };
                    let services = models[i].$getServices();
                    if (Object.keys(services).length)
                        for (let prop in services)
                            record.services.push(prop);
                    result.push(record);
                }
                resolve({ data: result });
            });
        }
    };
    __decorate([
        decorators_1.SERVICE()
    ], Permissions.prototype, "find", null);
    Permissions = __decorate([
        decorators_1.MODEL({
            secure: true,
            authorize: true
        })
    ], Permissions);
    let AuthRoles = class AuthRoles extends models_1.MongoModel {
        constructor() {
            super();
            this.authenticationModel = state_1.State.getModel(authConfig.usersModelConstructor.prototype.__name || authConfig.usersModelConstructor.name);
        }
        _mCreateRootRole(user) {
            this.$logger.info('creating default role');
            let role = {
                name: 'administrator',
                users: [user._id],
                permissions: [{ model: '*', services: ['*'] }]
            };
            return Promise.resolve(role);
        }
        _mInsertRootRole(role) {
            this.$logger.info('inserting default role');
            this.collection.insertOne(role)
                .then(() => { })
                .catch(error => { throw 'Unable to create root user role: ' + error; });
        }
        onCollection() {
            state_1.State.getModel('Authorization').roles = this.collection;
            this.$logger.info('checking roles collection');
            this.collection.find({})
                .toArray()
                .then(docs => {
                if (!docs || !docs.length) {
                    this.$logger.info('no roles found');
                    this.authenticationModel.getRootUser()
                        .then((user) => {
                        if (user)
                            this._mCreateRootRole(user)
                                .then((role) => this._mInsertRootRole(role))
                                .catch((error) => {
                                throw error;
                            });
                        else
                            this.authenticationModel.createRootUser()
                                .then((user) => this._mCreateRootRole(user))
                                .then((role) => this._mInsertRootRole(role))
                                .catch((error) => {
                                throw error;
                            });
                    })
                        .catch((error) => {
                        throw error;
                    });
                }
            })
                .catch(error => {
                this.$logger.error('error while initializing roles model:', error);
                throw error;
            });
        }
    };
    AuthRoles = __decorate([
        decorators_1.MODEL({
            secure: true,
            authorize: true,
            schema: {
                name: 'string',
                users: 'string[]',
                permissions: [{ model: 'string', services: 'string[]' }]
            },
            schemaOptions: { required: true }
        })
    ], AuthRoles);
    let AuthGroups = class AuthGroups extends models_1.MongoModel {
        onCollection() {
            state_1.State.getModel('Authorization').groups = this.collection;
        }
    };
    AuthGroups = __decorate([
        decorators_1.MODEL({
            secure: true,
            authorize: true,
            schema: {
                name: 'string',
                roles: 'string[]',
                users: 'string[]'
            },
            schemaOptions: { required: true }
        })
    ], AuthGroups);
    state_1.State.Models.push(Authorization, Permissions, AuthRoles, AuthGroups);
    var Authorization_1;
}
exports.initAuthorization = initAuthorization;
//# sourceMappingURL=authorization.js.map