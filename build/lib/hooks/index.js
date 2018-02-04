"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exists_1 = require("./exists");
const filter_1 = require("./filter");
const hash_1 = require("./hash");
const validate_1 = require("./validate");
exports.hooks = [
    exists_1.exists,
    filter_1.filter,
    hash_1.hash,
    validate_1.validate
];
//# sourceMappingURL=index.js.map