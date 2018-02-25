"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const state_1 = require("../state");
const util_1 = require("../util");
const types_1 = require("../types");
function generateClientGypsum() {
    let configurations = {
        origin: state_1.State.config.origin,
        models: []
    };
    let apps = state_1.State.apps;
    let subDomains = apps.filter(app => app.subdomain).map(app => app.name);
    for (let i = 0; i < state_1.State.models.length; i++) {
        let model = state_1.State.models[i];
        let modelApp = model.$get('app') || 'default';
        let isSubdomain = subDomains.indexOf(modelApp) > -1;
        let isSecure = state_1.State.apps.filter(app => (app.name === modelApp && app.secure)).length;
        let modelServices = model.$getServices();
        let services = {};
        for (let prop in modelServices) {
            let service = modelServices[prop];
            let path = null;
            let event = null;
            if (service.apiType !== types_1.API_TYPES.SOCKET) {
                path = 'http' + (isSecure ? 's' : '') + '://';
                path += (isSubdomain ? (modelApp + '.') : '') + state_1.State.config.host;
                path += (state_1.State.env !== 'production') ? ':' + state_1.State.config.port : '';
                path += '/' + (state_1.State.config.services_prefix ? state_1.State.config.services_prefix : '');
                path += service.path;
                path = util_1.stringUtil.cleanPath(path);
            }
            if (service.apiType !== types_1.API_TYPES.REST)
                event = service.event;
            services[service.name.toLowerCase()] = {
                name: service.name,
                event: event,
                method: service.method,
                path: path
            };
        }
        configurations.models.push({
            app: model.$get('app'),
            name: model.$get('name'),
            services: services
        });
    }
    let template = fs.readFileSync(path.join(__dirname, 'template.js'));
    template = template.toString().replace(/\{\}\/\/\{\}/, JSON.stringify(configurations));
    fs.writeFileSync(path.join(__dirname, 'index.js'), template);
}
exports.generateClientGypsum = generateClientGypsum;
//# sourceMappingURL=generate-client-gypsum.js.map