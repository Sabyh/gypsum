"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../misc/logger");
const authentication_1 = require("./authentication");
const config_1 = require("./config");
const Authorization_1 = require("./Authorization");
function AuthPlugin(authConfig, transporterOptions) {
    logger_1.Logger.Info('Initializing Authentication Layer...');
    let AuthConfig = {};
    if (authConfig)
        Object.assign(AuthConfig, config_1.defaultConfig, authConfig);
    else
        Object.assign(this.authConfig, config_1.defaultConfig);
    authentication_1.initAuthentication(AuthConfig, transporterOptions);
    if (AuthConfig.authorization)
        Authorization_1.initAuthorization(AuthConfig);
}
exports.AuthPlugin = AuthPlugin;
//# sourceMappingURL=index.js.map