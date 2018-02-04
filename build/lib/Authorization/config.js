"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const state_1 = require("../state");
exports.AuthorizationConfig = {
    defaultRole: 'administrator'
};
let configuration;
exports.configuration = configuration;
try {
    let userConfig = require(path.join(state_1.State.root, 'gypsum.authorization.json'));
    exports.configuration = configuration = Object.assign({}, exports.AuthorizationConfig, userConfig);
}
catch (e) { }
//# sourceMappingURL=config.js.map