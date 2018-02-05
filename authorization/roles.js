"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const decorators_1 = require("../decorators");
const state_1 = require("../state");
let AuthRoles = class AuthRoles extends models_1.MongoModel {
    constructor() {
        super();
        this.authenticationModel = state_1.State.getModel('Authentication');
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
exports.AuthRoles = AuthRoles;
//# sourceMappingURL=roles.js.map