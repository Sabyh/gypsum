"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../misc/logger");
const types_1 = require("../types");
const decorators_1 = require("../decorators");
const safe_1 = require("../misc/safe");
const state_1 = require("../state");
const safe = new safe_1.Safe('model');
const skippedServicesNames = ['find', 'findById', 'insert', 'update', 'updateById', 'delete', 'deleteById'];
class Model {
    static createPath(service, model) {
        let path = '';
        if (model) {
            path += model.$get('name') + '/';
            let modelApp = model.$get('app');
            if (modelApp) {
                let appConf = state_1.State.apps.find(app => app.name === modelApp);
                if (!appConf || !appConf.subdomain)
                    path = modelApp + '/' + path;
            }
        }
        path += service.path || (skippedServicesNames.indexOf(service.name) > -1 ? '' : service.name);
        if (service.params.length)
            for (let i = 0; i < service.params.length; i++)
                path += `/:${service.params[i]}`;
        return '/' + path.replace(/\/{2,}/g, '/').replace(/\/$/, '');
    }
    _mArrangeServices() {
        this._servicesData = {};
        let eliminationsList = this.$get('eliminate');
        for (let prop in this) {
            let service = this[prop];
            let isService = service.isService ? !this.$get('internal') : false;
            if (service && isService) {
                if (eliminationsList.indexOf(prop) > -1) {
                    delete this[prop];
                    continue;
                }
                service.authorize = service.authorize === false ? false : service.authorize || this.$get('authorize');
                if (service.secure === undefined)
                    if (service.authorize || this.$get('secure') || this.$get('authorize'))
                        service.secure = true;
                this._servicesData[prop] = {
                    isService: isService,
                    secure: service.secure,
                    authorize: service.authorize,
                    internal: service.internal,
                    apiType: this.$get('apiType') === types_1.API_TYPES.ALL ? service.apiType : this.$get('apiType'),
                    name: service.name,
                    event: `${this.$get('app') || ''} ${this.$get('name')} ${service.event}`.trim(),
                    method: service.method,
                    path: Model.createPath(service, this),
                    params: service.params,
                    domain: (!this.$get('domain') || this.$get('domain') > service.domain) ? service.domain : this.$get('domain'),
                    before: [],
                    after: [],
                    validate: service.validate || null
                };
                if (this.$get('before') && this.$get('before').length)
                    this._servicesData[prop].before = [...this.$get('before')];
                if (service.before && service.before.length) {
                    if (service.before[0] === "~") {
                        this._servicesData[prop].before = [...(service.before.slice(1))];
                    }
                    else {
                        this._servicesData[prop].before.push(...service.before);
                        cleanHooks(this._servicesData[prop].before);
                    }
                }
                if (this.$get('after') && this.$get('after').length)
                    this._servicesData[prop].after = [...this.$get('after')];
                if (service.after && service.after.length) {
                    if (service.after[0] === "~") {
                        this._servicesData[prop].after = [...(service.after.slice(1))];
                    }
                    else {
                        this._servicesData[prop].after.push('|', ...service.after);
                        cleanHooks(this._servicesData[prop].after);
                        let splitterIndex = this._servicesData[prop].after.indexOf('|');
                        this._servicesData[prop].after = [
                            ...this._servicesData[prop].after.slice(splitterIndex + 1),
                            ...this._servicesData[prop].after.slice(0, splitterIndex)
                        ];
                    }
                }
            }
        }
    }
    _mArrangeHooks() {
        this._hooksData = {};
        for (let prop in this) {
            if (this[prop] && this[prop].isHook) {
                this._hooksData[prop] = {};
                for (let key in this[prop])
                    this._hooksData[prop][key] = this[prop][key];
            }
        }
    }
    init() {
        this.$logger = new logger_1.Logger(this.$get('name'));
        this._mArrangeServices();
        this._mArrangeHooks();
    }
    $get(prop) {
        if (prop === 'name')
            return this.constructor.name;
        else
            return this[`__${prop}`] === undefined ? null : this[`__${prop}`];
    }
    $getServices() {
        return this._servicesData || this._mArrangeServices();
    }
    $getService(name) {
        return this._servicesData[name];
    }
    $getHooks() {
        return this._hooksData || this._mArrangeHooks();
    }
    $hasService(name) {
        return this._servicesData.hasOwnProperty(name) && this._servicesData[name].isService;
    }
    $hasHook(name) {
        return this._hooksData.hasOwnProperty(name) && this._hooksData[name].isHook;
    }
}
__decorate([
    decorators_1.FRIEND(safe.set('model.init', ['main']))
], Model.prototype, "init", null);
exports.Model = Model;
function cleanHooks(hooks) {
    for (let i = 0; i < hooks.length; i++) {
        let hook = hooks[i];
        let hookName = typeof hook === 'string' ? hook.split(':')[0] : hook.name;
        let modifier = hookName.charAt(0);
        if (modifier === '-') {
            hookName = hookName.slice(1);
            hooks.splice(i--, 1);
            for (let j = 0; j <= i; j++) {
                let currentHookName = typeof hooks[j] === 'string' ? hooks[j].split(':')[0] : hooks[j].name;
                if (currentHookName === hookName) {
                    hooks.splice(j--, 1);
                    i--;
                }
            }
        }
        else if (modifier === '=') {
            hookName = hookName.slice(1);
            if (typeof hook === 'string')
                hooks[i] = hooks[i].slice(1);
            else
                hook.name = hookName;
            for (let j = 0; j < i; j++) {
                let currentHookName = typeof hooks[j] === 'string' ? hooks[j].split(':')[0] : hooks[j].name;
                if (currentHookName === hookName) {
                    hooks.splice(j--, 1);
                    i--;
                }
            }
        }
    }
}
//# sourceMappingURL=model.js.map