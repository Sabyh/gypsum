"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../model/model");
const decorators_1 = require("../decorators");
const index_1 = require("../types/index");
const index_2 = require("../util/index");
let Authorization = Authorization_1 = class Authorization extends model_1.Model {
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
    authorize(ctx, options) {
        if (!ctx.user)
            return ctx.next({
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
                        return ctx.next();
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
                        return ctx.next({
                            message: `${Authorization_1}: bad options provided: ${options}`,
                            code: index_1.RESPONSE_CODES.BAD_REQUEST
                        });
                    let val01 = index_2.objectUtil.getValue(ctx.user, userField);
                    let val02 = index_2.objectUtil.getValue(ctx[contextField], contextSubField);
                    if (userField === '_id')
                        val01 = val01.toString();
                    if (val01 !== val02)
                        return ctx.next({
                            message: 'user not authorized',
                            code: index_1.RESPONSE_CODES.UNAUTHORIZED
                        });
                }
                return ctx.next();
            }
            ctx.next({
                message: 'user not authorized',
                code: index_1.RESPONSE_CODES.UNAUTHORIZED
            });
        })
            .catch(error => ctx.next({
            message: 'Error authorizing user',
            original: error,
            code: index_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
};
__decorate([
    decorators_1.HOOK()
], Authorization.prototype, "authorize", null);
Authorization = Authorization_1 = __decorate([
    decorators_1.MODEL()
], Authorization);
exports.Authorization = Authorization;
var Authorization_1;
//# sourceMappingURL=main.js.map