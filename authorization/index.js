"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
const main_1 = require("./main");
const roles_1 = require("./roles");
const groups_1 = require("./groups");
const permissions_1 = require("./permissions");
const logger_1 = require("../misc/logger");
function initAuthorization() {
    logger_1.Logger.Info('Initializing Authorization Layer...');
    state_1.State.Models.push(main_1.Authorization, roles_1.AuthRoles, groups_1.AuthGroups, permissions_1.Permissions);
}
exports.initAuthorization = initAuthorization;
//# sourceMappingURL=index.js.map