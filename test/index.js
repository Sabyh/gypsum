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
let Users = class Users extends models_1.FileModel {
};
Users = __decorate([
    decorators_1.MODEL({
        schema: {
            name: 'string',
            active: { $type: 'boolean', $default: false, $props: { constant: true } }
        }
    })
], Users);
main_1.Gypsum
    .configure()
    .use({
    models: [Users]
})
    .bootstrap();
//# sourceMappingURL=index.js.map