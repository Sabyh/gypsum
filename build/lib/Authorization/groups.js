"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_model_1 = require("../model/mongo-model");
const index_1 = require("../decorators/index");
const state_1 = require("../state");
let AuthGroups = class AuthGroups extends mongo_model_1.MongoModel {
    onCollection() {
        state_1.State.getModel('Authorization').groups = this.collection;
    }
};
AuthGroups = __decorate([
    index_1.MODEL({
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
exports.AuthGroups = AuthGroups;
//# sourceMappingURL=groups.js.map