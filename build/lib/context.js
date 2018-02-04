"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("./state");
const safe_1 = require("./misc/safe");
const logger_1 = require("./misc/logger");
const types_1 = require("./types");
const index_1 = require("./util/index");
const safe = new safe_1.Safe('context');
const contexts = [];
class Context {
    constructor(type, data) {
        this._response = {};
        this._stack = [];
        this._locals = {};
        this.user = null;
        this._socket = data.socket || undefined;
        this._res = data.res || undefined;
        this._cookies = data.cookies;
        this._domain = data.domain;
        this._room = data.room || '';
        this.apiType = type;
        this.headers = data.headers;
        this.query = data.query;
        this.body = data.body;
        this.params = data.params;
        this.model = data.model;
        this.service = data.service;
        this.logger = new logger_1.Logger(this.service.name);
        this._mInit();
    }
    static Rest(model, service) {
        return function (req, res, next) {
            contexts.push(new Context(types_1.API_TYPES.REST, {
                headers: req.headers,
                query: req.query,
                body: req.body,
                params: req.params,
                cookies: req.cookies,
                res: res,
                model: model,
                service: service
            }));
        };
    }
    static Socket(socket, model, service) {
        return function (data) {
            contexts.push(new Context(types_1.API_TYPES.SOCKET, {
                headers: data.headers,
                query: data.query,
                body: data.body,
                params: data.params,
                socket: socket,
                domain: data.domain,
                room: data.room,
                model: model,
                service: service
            }));
        };
    }
    static deleteContextsOf(type, identifier) {
        if (type === 'socket') {
            if (identifier)
                for (let i = 0; i < contexts.length; i++)
                    if (contexts[i]._socket && contexts[i]._socket.id === identifier)
                        contexts.splice(i--, 1);
        }
        else if (type === 'model') {
            if (identifier)
                for (let i = 0; i < contexts.length; i++)
                    if (contexts[i].model.__name === identifier)
                        contexts.splice(i--, 1);
        }
    }
    _mInit(hooks = 'both', extraHooks) {
        if (this.service.secure) {
            let Authentication = state_1.State.getModel('Authentication');
            this._stack.push({ handler: Authentication.secure.bind(Authentication), args: [] });
        }
        if (this.service.authorize) {
            let Authorization = state_1.State.getModel('Authorization');
            this._stack.push({ handler: Authorization.authorize.bind(Authorization), args: [this.service.authorize] });
        }
        if (this.service.validate)
            this._stack.push({ handler: state_1.State.getHook('validate'), args: [this.service.validate] });
        if ((hooks === 'both' || hooks === 'before') && this.service.before && this.service.before.length)
            this._mPushStack(this.service.before);
        this._stack.push({ handler: this.model[this.service.name].bind(this.model), args: [] });
        if ((hooks === 'both' || hooks === 'after') && this.service.after && this.service.after.length)
            this._mPushStack(this.service.after);
        if (extraHooks && extraHooks.length)
            this._stack.push(...extraHooks);
        this.next();
    }
    _mRespond() {
        this._response.requestType = this.apiType;
        this._response.code = this._response.code || types_1.RESPONSE_CODES.UNKNOWN_ERROR;
        if (this.apiType === types_1.API_TYPES.REST && this._res) {
            this._res.status(this._response.code).json(this._response);
        }
        else if (this._socket) {
            this._response.event = this.service.event;
            if (!this._response.success) {
                this._socket.emit(this._response.event, this._response);
            }
            else {
                this._response.domain = this._response.domain || this._domain || this.service.domain;
                this._response.room = this._room || this._response.room;
                if (this._response.domain === types_1.RESPONSE_DOMAINS.ROOM && this._response.room) {
                    if (process && process.send)
                        process.send({ data: this._response, target: 'others', action: 'response' });
                    this._socket.to(this._response.room).emit(this._response.event, this._response);
                }
                else if (this._response.domain === types_1.RESPONSE_DOMAINS.ALL_ROOM && this._response.room) {
                    if (process && process.send)
                        process.send({ data: this._response, target: 'others', action: 'response' });
                    this._socket.broadcast.to(this._response.room).emit(this._response.event, this._response);
                }
                else if (this._response.domain === types_1.RESPONSE_DOMAINS.OTHERS) {
                    if (process && process.send)
                        process.send({ data: this._response, target: 'others', action: 'response' });
                    this._socket.broadcast.emit(this._response.event, this._response);
                }
                else if (this._response.domain === types_1.RESPONSE_DOMAINS.ALL) {
                    if (process && process.send)
                        process.send({ data: this._response, target: 'others', action: 'response' });
                    let io = state_1.State[safe.get('State._io')];
                    io.sockets.emit(this._response.event, this._response);
                }
                else {
                    this._socket.emit(this._response.event, this._response);
                }
            }
        }
    }
    _mPushStack(hooksList) {
        if (hooksList && hooksList.length)
            for (let hook of getHooks(this, hooksList))
                if (hook && hook.handler)
                    this._stack.push(hook);
    }
    useService(model, service, hooks = 'both', clearOwnHooks = false) {
        this.model = model;
        this.service = this.model[service];
        let extraHooks;
        if (!clearOwnHooks)
            extraHooks = this._stack;
        this._stack = [];
        this._mInit(hooks, extraHooks);
    }
    useServiceHooks(service, clearOwnHooks = false) {
        if (clearOwnHooks)
            this._stack = [];
        this._mPushStack(service.after);
    }
    set domain(value) { this._domain = value; }
    get room() { return this._room; }
    getHeader(name) {
        return this.headers[name];
    }
    get(name) {
        return this._locals[name];
    }
    set(name, value) {
        if (name)
            this._locals[name] = value;
        return this;
    }
    remove(name) {
        if (name)
            delete this._locals[name];
        return this;
    }
    cookie(name, value, options = { httpOnly: true }) {
        if (this.apiType === types_1.API_TYPES.REST && name && value)
            this._res.cookie(name, value, options);
        return this;
    }
    cookies(name) {
        return this._cookies[name];
    }
    clearCookie(name) {
        if (this.apiType === types_1.API_TYPES.REST)
            this._res.cookie(name, "", { maxAge: 0 });
        return this;
    }
    joinRoom(roomName) {
        if (this.apiType === types_1.API_TYPES.SOCKET && this._socket)
            if (roomName || this._room) {
                this._socket.join(roomName || this._room);
                return true;
            }
        return false;
    }
    next(err) {
        if (err) {
            console.trace(err);
            this._response = new types_1.Response({ data: new types_1.ResponseError(err), code: err.code });
            this._mRespond();
        }
        else {
            let current = this._stack.splice(0, 1)[0];
            if (current)
                current.handler(this, ...current.args);
            else
                this._mRespond();
        }
    }
    ok(data, count, code = types_1.RESPONSE_CODES.OK) {
        this._response = new types_1.Response({ data, count, code });
        this._response.count = count || this._response.count;
        this._response.code = code || this._response.code;
        this.next();
    }
    getResponseData() {
        return this._response.data;
    }
    setResponseData(data) {
        Object.assign(this._response.data || {}, data || {});
        return this;
    }
    sendHtml(html, code = 200) {
        if (this._res) {
            this._res.type('html')
                .status(code)
                .send(html);
        }
        else {
            this.next({
                message: 'cannot send html content on socket connection',
                code: types_1.RESPONSE_CODES.BAD_REQUEST
            });
        }
    }
    sendFile(filePath, code = 200) {
        if (this._res)
            this._res.status(code).sendFile(filePath);
        else
            this.next({
                message: 'cannot send file on socket connection',
                code: types_1.RESPONSE_CODES.BAD_REQUEST
            });
    }
}
exports.Context = Context;
function* getHooks(context, list) {
    for (let i = 0; i < list.length; i++) {
        let hook = list[i];
        let args = typeof hook === 'string' ? hook.split(':') : (hook.args ? (Array.isArray(hook.args) ? hook.args : [hook.args]) : []);
        let hookName = typeof hook === 'string' ? args.shift() : hook.name;
        let handler = undefined;
        if (hookName) {
            if (hookName.indexOf('.') > -1) {
                let modelName, modelHook;
                [modelName, modelHook] = hookName.split('.');
                let model = state_1.State.getModel(modelName);
                if (model) {
                    if (model.$hasHook(modelHook))
                        if (model[modelHook].private && modelName !== context.model.$get('name'))
                            yield null;
                        else
                            handler = model[modelHook].bind(model);
                    else
                        yield null;
                }
                else {
                    yield null;
                }
            }
            else {
                (handler = state_1.State.getHook(hookName)) || (yield null);
            }
        }
        else {
            yield null;
        }
        let params = [];
        if (args && args.length) {
            for (let j = 0; j < args.length; j++) {
                if (typeof args[j] === 'string') {
                    if (args[j].indexOf(',') > -1) {
                        args[j] = args[j].split(',');
                        for (let x = 0; x < args[j].length; x++)
                            args[j][x] = getReference(context, args[j][x], hookName);
                    }
                    else {
                        args[j] = getReference(context, args[j], hookName);
                    }
                }
                params[j] = args[j];
            }
        }
        yield { handler: handler, args, params };
    }
}
function getReference(ctx, name, hookName) {
    if (name.charAt(0) === '@') {
        let model = state_1.State.getModel(name.slice(1));
        name = name.slice(1);
        if (!model) {
            ctx.logger.warn(`${hookName} hook: model '${name}' is not found`);
            return undefined;
        }
        let accessable = model.$get('accessable');
        let isAccessable = typeof accessable === 'boolean' ? accessable : accessable.indexOf(hookName) > -1;
        if (!isAccessable) {
            ctx.logger.warn(`model '${name}' is not accessable from '${hookName}' hook`);
            return undefined;
        }
        return model;
    }
    else if (name.indexOf('.') > -1) {
        let parts = name.split('.');
        if (parts[0] === 'locals')
            return ctx.get(parts[1]);
        else if (parts[0] === 'cookies')
            return ctx.cookies(parts[1]);
        else if (['headers', 'query', 'body', 'params'].indexOf(parts[0]) > -1) {
            let root = parts.shift();
            return index_1.objectUtil.getValue(ctx[root], parts.join('.'));
        }
        else
            return name;
    }
    return name;
}
//# sourceMappingURL=context.js.map