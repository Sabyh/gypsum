"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("../");
let Users = class Users extends _1.MongoModel {
    updateById(ctx) {
        super.updateById(ctx);
    }
};
__decorate([
    _1.SERVICE({
        authorize: ['_id:params.id']
    })
], Users.prototype, "updateById", null);
Users = __decorate([
    _1.MODEL({
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
function testHook02(ctx, place) {
    console.log('message from test 02, ' + place);
    ctx.next();
}
function testHook03(ctx, place) {
    console.log('message from test 03, ' + place);
    ctx.next();
}
_1.Gypsum.make({
    models: [Users],
    hooks: [testHook01, testHook02, testHook03]
});
//# sourceMappingURL=index.js.map