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
let Coll01 = class Coll01 extends models_1.MongoModel {
};
Coll01 = __decorate([
    decorators_1.MODEL({
        app: 'db01'
    })
], Coll01);
let Coll02 = class Coll02 extends models_1.MongoModel {
};
Coll02 = __decorate([
    decorators_1.MODEL({
        app: 'db02'
    })
], Coll02);
main_1.Gypsum
    .configure({
    dev: {
        database: {
            databases: [
                { name: 'db01' },
                { name: 'db02' }
            ]
        }
    }
})
    .use({
    models: [Coll01, Coll02]
})
    .bootstrap();
//# sourceMappingURL=index.js.map