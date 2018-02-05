"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
const logger_1 = require("../misc/logger");
const main_1 = require("./main");
const Authorization_1 = require("../Authorization");
function initAuthentication() {
    logger_1.Logger.Info('Initializing Authentication Layer...');
    state_1.State.Models.push(main_1.Authentication);
    if (state_1.State.config.authorization)
        Authorization_1.initAuthorization();
}
exports.initAuthentication = initAuthentication;
//# sourceMappingURL=index.js.map