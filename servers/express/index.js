"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const express = require("express");
const state_1 = require("../../state");
const logger_1 = require("../../misc/logger");
const configure_app_1 = require("./configure_app");
const push_apis_1 = require("./push_apis");
const vhost = require('vhost');
function initExpress(app) {
    const logger = new logger_1.Logger('express');
    configure_app_1.configure(app, 'express', logger);
    logger.info('Implementing statics..');
    if (state_1.State.config.statics && state_1.State.config.statics.length) {
        for (let i = 0; i < state_1.State.config.statics.length; i++) {
            let parts = state_1.State.config.statics[i].split(',');
            let fileName = parts[0];
            let prefix = parts[1] || '';
            logger.info(`static file path: '${path.join(state_1.State.root, fileName)}', static prefix: '${prefix}'`);
            app.use(prefix, express.static(path.join(state_1.State.root, fileName)));
        }
    }
    app.get('/gypsum-client.js', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/client.js'));
    });
    let subDomains = state_1.State.apps.filter(app => app.subdomain).map(app => ({ name: app.name, spa: app.spa }));
    if (subDomains.length) {
        for (let i = 0; i < subDomains.length; i++) {
            let subApp = express();
            configure_app_1.configure(subApp, subDomains[i].name);
            push_apis_1.pushApis(subApp, subDomains[i].name, true, subDomains[i].spa);
            app.use(vhost(`${subDomains[i].name}.${state_1.State.config.host}`, subApp));
        }
    }
    push_apis_1.pushApis(app, 'default', false, state_1.State.config.spa, logger);
}
exports.initExpress = initExpress;
//# sourceMappingURL=index.js.map