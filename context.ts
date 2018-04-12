import * as express from 'express';
import { State } from './state';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';
import { Model } from './models';
import { IService, IHookOptions } from './decorators';
import { API_TYPES, RESPONSE_CODES, RESPONSE_DOMAINS, Response, ResponseError, IResponseError } from './types';
import { objectUtil, stringUtil } from './util/index';

const safe = new Safe('context');

export interface IContext {
  headers: any;
  query: any;
  body: any;
  params: any[];
  model: Model;
  service: IService;
  cookies?: any;
  req?: express.Request;
  res?: express.Response;
  socket?: any;
  appName?: any;
  domain?: RESPONSE_DOMAINS;
  room?: string;
}

interface IStack {
  handler: (ctx: Context, ...args: any[]) => void;
  args: any[];
}

export class Context {
  private _response: Response = <Response>{};
  private _socket: any | undefined;
  private _stack: IStack[] = [];
  private _locals: any = {};
  private _cookies: any;
  private _domain: RESPONSE_DOMAINS | undefined;

  readonly appName: string;
  readonly _req: express.Request | undefined;
  readonly _res: express.Response | undefined;

  public room: string;
  public model: Model;
  public service: IService;
  public apiType: API_TYPES.REST | API_TYPES.SOCKET;
  public headers: any;
  public query: any;
  public body: any;
  public params: any;
  public user: any = null;
  public logger: Logger;

  constructor(type: API_TYPES.REST | API_TYPES.SOCKET, data: IContext) {
    this._socket = data.socket || undefined;
    this._req = data.req || undefined;
    this._res = data.res || undefined;
    this._cookies = data.cookies;
    this._domain = data.domain;
    this.appName = data.appName;
    this.room = data.room || '';
    this.apiType = type;
    this.headers = data.headers;
    this.query = data.query;
    this.body = data.body;
    this.params = data.params;
    this.model = data.model;
    this.service = data.service;
    this.logger = new Logger(`${this.appName}.${this.model.name}.${this.service.name}`);


    this._mInit();
  }

  static Rest(appName: string, model: Model, service: IService)
    : (req: express.Request, res: express.Response, next: express.NextFunction) => void {

    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
      new Context(API_TYPES.REST, {
        headers: req.headers,
        query: req.query,
        body: req.body,
        params: req.params,
        cookies: req.cookies,
        req: req,
        res: res,
        appName: appName,
        model: model,
        service: service
      });
    }
  }

  static Socket(appName: string, socket: any, model: Model, service: IService): (data: any) => void {
    return function (data: any) {
      new Context(API_TYPES.SOCKET, {
        headers: socket.handshake.headers,
        query: data.query,
        body: data.body,
        params: data.params,
        socket: socket,
        domain: data.domain,
        room: data.room,
        model: model,
        service: service,
        appName: appName || 'default'
      });
    }
  }

  private _mInit(hooks: 'before' | 'after' | 'both' | 'none' = 'both', extraHooks?: any[], extraHooksPos: 0 | 1 | -1 = 0): void {
    let stackDetails = {
      secure: { should: 0, actual: 0 },
      authorize: { should: 0, actual: 0 },
      validate: { should: 0, actual: 0 },
      before: { should: 0, actual: 0 },
      service: { should: 0, actual: 0 },
      after: { should: 0, actual: 0 },
      extra: { should: 0, actual: 0 }
    };

    let total = 0;

    // Authentication Layer
    this.logger.debug(`checking authentication layer with options: ${this.service.secure}`);
    if (this.service.secure && State.config.authenticationModelPath) {
      stackDetails.secure.should = 1;
      let authApp, authModel;
      [authApp, authModel] = State.config.authenticationModelPath.split('.');
      let Authentication = State.getModel(authModel, authApp);
      if (Authentication)
        this._stack.push({ handler: (<any>Authentication).Authenticate.bind(Authentication), args: [] });
    }
    stackDetails.secure.actual = total = this._stack.length;

    this.logger.debug(`checking authorization layer with options: ${this.service.authorize}`);
    if (this.service.authorize && State.config.authorizationModelPath) {
      stackDetails.authorize.should = 1;
      let authApp, authModel;
      [authApp, authModel] = State.config.authorizationModelPath.split('.');
      let Authorization = State.getModel(authModel, authApp);
      if (Authorization)
        this._stack.push({ handler: (<any>Authorization).Authorize.bind(Authorization), args: [this.service.authorize] });
    }
    stackDetails.authorize.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug(`checking validate hook with options: ${this.service.validate}`);
    if (this.service.validate) {
      stackDetails.validate.should = 1;
      this._stack.push({ handler: <any>State.getHook('validate'), args: [this.service.validate] });
    }
    stackDetails.validate.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug(`checking before hooks with options: ${this.service.before}`);
    // Pushing before hooks to the stack
    if ((hooks === 'both' || hooks === 'before') && this.service.before && this.service.before.length) {
      stackDetails.before.should = this.service.before.length;
      this._mPushStack(this.service.before);
    }
    stackDetails.before.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug('adding main service');
    // Pushing service to the stack
    stackDetails.service.should = 1;
    this._stack.push({ handler: (<any>this.model)[this.service.__name].bind(this.model), args: [] });
    stackDetails.service.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug('checking extra hooks pre after hooks');
    if (extraHooks && extraHooks.length && extraHooksPos === -1) {
      stackDetails.extra.should = extraHooks.length;
      this._stack.push(...extraHooks);
    }
    stackDetails.extra.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug(`checking after hooks with options: ${this.service.after}`);
    // Pushing after hooks to the stack
    if ((hooks === 'both' || hooks === 'after') && this.service.after && this.service.after.length) {
      stackDetails.after.should = this.service.after.length;
      this._mPushStack(this.service.after);
    }
    stackDetails.after.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug('checking extra hooks post after hooks' && extraHooksPos === 1);
    if (extraHooks && extraHooks.length) {
      stackDetails.extra.should = extraHooks.length;
      this._stack.push(...extraHooks);
    }
    stackDetails.extra.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug('stack details:', JSON.stringify(stackDetails, null, 2));

    this.logger.debug('running the stack');
    this.next();
  }

  private _mRespond(): void {
    this._response.apiType = this.apiType;
    this._response.code = this._response.code || RESPONSE_CODES.UNKNOWN_ERROR;
    this._response.domain = this._response.domain || this.service.domain || RESPONSE_DOMAINS.SELF;

    this.logger.debug('response:');
    this.logger.debug(JSON.stringify(this._response, null, 2));

    if (this.apiType === API_TYPES.REST && this._res) {
      this._res.status(this._response.code).json(this._response);

    } else if (this._socket) {
      let event = this.service.event;
      if (this._response.code < 200 || this._response.code >= 300) {
        this._socket.emit(event, this._response);

      } else {
        let domain = this._response.domain || this._domain || this.service.domain;
        this._response.room = this.room || this._response.room;

        if (this._response.domain === RESPONSE_DOMAINS.ROOM && this._response.room) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response' })
          this._socket.to(this._response.room).emit(event, this._response);

        } else if (this._response.domain === RESPONSE_DOMAINS.ALL_ROOM && this._response.room) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response' })
          this._socket.broadcast.to(this._response.room).emit(event, this._response);

        } else if (this._response.domain === RESPONSE_DOMAINS.OTHERS) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response' })
          this._socket.broadcast.emit(event, this._response);

        } else if (this._response.domain === RESPONSE_DOMAINS.ALL) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response', appName: this.appName })

          let io: any = State.ioNamespaces[this.appName];

          if (io)
            io.sockets.emit(event, this._response);

        } else {
          this._socket.emit(event, this._response);
        }
      }
    }
  }

  private _mPushStack(hooksList: IHookOptions[]) {
    if (hooksList && hooksList.length)
      for (let hook of getHooks(this, hooksList))
        if (hook && hook.handler)
          this._stack.push(hook);
  }

  useService(model: Model, service: string, hooks: 'before' | 'after' | 'both' | 'none' = 'both', useOwnHooks: 0 | 1 | -1 = 0) {
    this.model = model;
    this.service = (<any>this.model)[stringUtil.capitalizeFirst(service)];
    let extraHooks;

    if (useOwnHooks !== 0)
      extraHooks = this._stack;

    this._stack = [];
    this._mInit(hooks, extraHooks, useOwnHooks);
  }

  useServiceHooks(service: IService, clearOwnHooks: boolean = false) {
    
    if (service) {
      if (clearOwnHooks)
        this._stack = [];
        
      this._mPushStack(service.after);
    } else {
      this.logger.warn('cannot user undifined service hooks!');
    }
  }

  get domain(): RESPONSE_DOMAINS { return <RESPONSE_DOMAINS>this._domain; }
  set domain(value: RESPONSE_DOMAINS) { this._domain = value; }

  getHeader(name: string): string {
    return this.headers[name];
  }

  get(name: string): any {
    return this._locals[name];
  }

  set(name: string, value: any): Context {
    if (name)
      this._locals[name] = value;

    return this;
  }

  remove(name: string): Context {
    if (name)
      delete this._locals[name];

    return this;
  }

  cookie(name: string, value: string, options: any = { httpOnly: true }): Context {
    if (this.apiType === API_TYPES.REST && name && value)
      this._res!.cookie(name, value, options);

    return this;
  }

  cookies(name: string): string {
    return this._cookies[name];
  }

  clearCookie(name: string): Context {
    if (this.apiType === API_TYPES.REST)
      this._res!.cookie(name, "", { maxAge: 0 });

    return this;
  }

  socketsJoinRoom(roomName: string, socketIds: string[]) {
    if (roomName && socketIds && socketIds.length) {
      let ns = State.ioNamespaces[this.appName];

      if (ns) {
        for (let i = 0; i < socketIds.length; i++) {
          let nsSockets = ns.sockets.sockets;

          if (nsSockets[socketIds[i]]) {
            nsSockets[socketIds[i]].join(roomName);
            socketIds.splice(i--, 1);
            break;
          }
        }
      }

      if (socketIds.length)
        if (process && process.send)
          (<any>process).send({ data: { room: roomName, socketIds: socketIds }, target: 'others', action: 'join room', namespace: this.appName })
    }
  }

  joinRoom(roomName?: string): boolean {
    if (this.apiType === API_TYPES.SOCKET && this._socket)
      if (roomName || this.room) {
        this._socket.join(roomName || this.room);
        return true;
      }

    return false;
  }

  leaveRoom(room: string): boolean {
    if (this.apiType === API_TYPES.SOCKET && this._socket)
      if (room) {
        this._socket.leave(room);
        return true;
      }

    return false;
  }

  next(err?: IResponseError): void {
    if (err) {
      console.trace(err);
      this._response = new Response({ error: new ResponseError(err), code: err.code });
      this._mRespond();

    } else {
      let current = this._stack.splice(0, 1)[0];

      if (current) {
        this.logger.debug(`running stack handler: ${(<any>current.handler).__name || current.handler.name}`);
        current.handler(this, ...current.args);
      } else {
        this.logger.debug('end of stack, preparing for responding...')
        this._mRespond();
      }
    }
  }

  nextHook(hook: any, args?: any[]) {
    if (!hook)
      return this;

    if (typeof hook === 'function') {
      this._stack.unshift({ handler: hook, args: args || [] });
      return this;
    }

    let handler = State.getHook(hook);

    if (handler)
      this._stack.unshift({ handler: handler, args: args || [] });
    else
      this.logger.warn(`${hook} was not found`);

    return this;
  }

  ok(res: Response): void {
    if (res.type === 'html')
      return this._mSendHtml(res.data, res.code);
    else if (res.type === 'file')
      return this._mSendFile(res.data, res.code);

    this._response = res;
    this.next();
  }

  getResponseData(): any {
    return this._response.data;
  }

  setResponseData(data: any): Context {
    Object.assign(this._response.data || {}, data || {});
    return this;
  }

  private _mSendHtml(html: string, code = 200) {
    if (this._res) {
      this._res.type('html')
        .status(code)
        .send(html);
    } else {
      this.next({
        message: 'cannot send html content on socket connection',
        code: RESPONSE_CODES.BAD_REQUEST
      });
    }
  }

  private _mSendFile(filePath: string, code = 200) {
    if (this._res)
      this._res.status(code).sendFile(filePath);
    else
      this.next({
        message: 'cannot send file on socket connection',
        code: RESPONSE_CODES.BAD_REQUEST
      });
  }
}

function* getHooks(context: Context, list: IHookOptions[]) {

  for (let i = 0; i < list.length; i++) {
    let hook = list[i];
    let args = typeof hook === 'string' ? hook.split(':') : (hook.args ? (Array.isArray(hook.args) ? hook.args : [hook.args]) : []);
    let hookName = typeof hook === 'string' ? args.shift().toLowerCase() : hook.name.toLowerCase();
    let handler: ((ctx: Context, ...args: any[]) => void) | undefined = undefined;

    if (hookName) {
      if (hookName.indexOf('.') > -1) {
        let appName, modelName, modelHookName;
        [appName, modelName, modelHookName] = hookName.split('.');

        let model = State.getModel(modelName, appName);

        if (model) {
          let modelHook = model.$getHook(modelHookName);

          if (modelHook) {
              handler = (<any>model)[modelHook.__name].bind(model);
          } else {
            yield null;
          }

        } else {
          yield null;
        }

      } else {
        (handler = State.getHook(hookName)) || (yield null);
      }
    } else {
      yield null;
    }

    let params: any[] = [];

    if (args && args.length) {
      for (let j = 0; j < args.length; j++) {
        if (typeof args[j] === 'string') {

          if (args[j].indexOf(',') > -1) {
            args[j] = args[j].split(',');
            for (let x = 0; x < args[j].length; x++)
              args[j][x] = getReference(context, args[j][x], hookName);
          } else {
            args[j] = getReference(context, args[j], hookName);
          }
        }

        params[j] = args[j];
      }
    }

    yield <IStack>{ handler: handler, args, params };
  }
}

function getReference(ctx: Context, name: string, hookName: string) {

  // if referencing a model
  if (name.charAt(0) === '@') {
    let app, modelName;
    [app, modelName] = name.split('.');
    let model = State.getModel(modelName, app.slice(1));

    if (!model) {
      ctx.logger.warn(`${hookName} hook: model '${modelName}' is not found`);
      return undefined;
    }

    let accessable = model.$get('accessable');
    let isAccessable = typeof accessable === 'boolean' ? accessable : accessable.indexOf(hookName) > -1;

    if (!isAccessable) {
      ctx.logger.warn(`model '${modelName}' is not accessable from '${hookName}' hook`)
      return undefined;
    }

    return model;

    // referencing context properties locals, cookies, headers, query, body or params
  } else if (name.indexOf('.') > -1) {
    let parts = name.split('.');

    if (parts[0] === 'locals')
      return ctx.get(parts[1]);
    else if (parts[0] === 'cookies')
      return ctx.cookies(parts[1]);
    else if (['headers', 'query', 'body', 'params'].indexOf(parts[0]) > -1) {
      let root = parts.shift();
      return objectUtil.getValue((<any>ctx)[<string>root], parts.join('.'));
    } else
      return name;
  }

  return name;
}