"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../main");
const decorators_1 = require("../decorators");
const models_1 = require("../models");
const types_1 = require("../types");
let Users = class Users extends models_1.Model {
    publish(ctx) {
        ctx.ok({ pid: process.pid });
    }
};
__decorate([
    decorators_1.SERVICE({
        domain: types_1.RESPONSE_DOMAINS.ALL
    })
], Users.prototype, "publish", null);
Users = __decorate([
    decorators_1.MODEL({
        after: ['filter:-password,passwordSalt'],
        schema: {
            username: 'string',
            email: 'string',
            password: 'string',
            passwordSalt: 'string',
            'age?': 'number',
            createdAt: { $type: 'date', $default: 'Date.now' },
            isActive: { $type: 'boolean', $default: false }
        },
        schemaOptions: { required: true, strict: true }
    })
], Users);
function testHook01(ctx, place) {
    console.log('message from test 01, ' + place);
    ctx.next();
}
main_1.Gypsum
    .configure({
    dev: {
        server: {
            processes: 3
        }
    }
})
    .use({
    models: [Users],
    hooks: [testHook01]
})
    .bootstrap();
//# sourceMappingURL=index.js.map