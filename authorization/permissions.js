"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const model_1 = require("../decorators/model");
const service_1 = require("../decorators/service");
const state_1 = require("../state");
let Permissions = class Permissions extends models_1.Model {
    find(ctx) {
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
        ctx.ok(result);
    }
};
__decorate([
    service_1.SERVICE()
], Permissions.prototype, "find", null);
Permissions = __decorate([
    model_1.MODEL({
        secure: true,
        authorize: true
    })
], Permissions);
exports.Permissions = Permissions;
//# sourceMappingURL=permissions.js.map