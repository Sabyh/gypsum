import * as express from 'express';
import { State } from './state';
import { Logger } from './misc/logger';
import { Model } from './models';
import { IService, IHookOptions, IHook, IServiceOptions } from './decorators';
import { API_TYPES, RESPONSE_CODES, RESPONSE_DOMAINS, Response, ResponseError, IResponseError, IResponse } from './types';
import { objectUtil, stringUtil } from './util/index';
import { Users } from './auth/users';

export interface IContext {
  rid: string;
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
  appName?: string;
  namespace?: string;
  domain?: RESPONSE_DOMAINS;
  room?: string;
}

export type IContextOptions = {
  [key in keyof IContext]?: IContext[key];
}

interface IStack {
  handler: (ctx: Context, ...args: any[]) => void;
  args: any[];
  mainHandler?: boolean;
}

export class Context {
  private _rid: string;
  private _locals: any = {};
  private _cookies: any;
  private _domain: RESPONSE_DOMAINS | undefined;
  private _mainHandler = false;
  private _resolve: Function = null;
  private _reject: Function = null;
  private _stack: IStack[] = [];

  readonly _socket: any | undefined;
  readonly _appName: string;
  readonly _namespace: string;
  readonly _req: express.Request | undefined;
  readonly _res: express.Response | undefined;

  public response: Response = <Response>{};
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

  constructor(type: API_TYPES.REST | API_TYPES.SOCKET, data: IContext, init = true) {
    this._socket = data.socket || undefined;
    this._req = data.req || undefined;
    this._res = data.res || undefined;
    this._cookies = data.cookies;
    this._rid = data.rid;
    this._domain = data.domain;
    this._appName = data.appName;
    this._namespace = data.namespace || data.appName;
    this.room = data.room || '';
    this.apiType = type;
    this.headers = data.headers;
    this.query = data.query;
    this.body = data.body;
    this.params = data.params;
    this.model = data.model;
    this.service = data.service;
    this.logger = new Logger(`${this._appName}.${this.model.name}.${this.service.name}`);

    if (init)
      this._mInit();
  }

  static Publish(model: Model, serviceName: string, data: IResponse) {
    return new Promise((resolve, reject) => {

      if (!State.currentContext)
        return reject({
          message: 'could not access current context!'
        });

      if (State.currentContext.apiType === API_TYPES.REST || !State.currentContext._socket) {
        return reject({
          message: 'could not publish during rest request!'
        });
      }

      let serviceData = model.$getService(serviceName);

      if (!serviceData) {
        return reject({
          message: `could not publish: service not found: ${serviceName}!`
        });
      }

      let service = mimicService(serviceName, {
        crud: serviceData.crud,
        domain: serviceData.domain,
        after: serviceData.after.slice(1)
      });

      let context = new Context(API_TYPES.SOCKET, {
        rid: model.name === State.currentContext.model.name ? State.currentContext._rid : null,
        headers: State.currentContext.headers,
        query: State.currentContext.query,
        body: State.currentContext.body,
        params: State.currentContext.params,
        cookies: State.currentContext.cookies,
        req: State.currentContext._req,
        res: State.currentContext._res,
        appName: model.app.name,
        namespace: model.app.name,
        model: model,
        service: service
      }, false);

      context._resolve = resolve;
      context._reject = reject;
      context._mPushStack(service.after);
      context.ok(<Response>data);
    });
  }

  static Rest(appName: string, model: Model, service: IService)
    : (req: express.Request, res: express.Response, next: express.NextFunction) => void {

    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
      new Context(API_TYPES.REST, {
        rid: null,
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

  static Socket(appName: string, namespace: string, socket: any, model: Model, service: IService): (data: any) => void {
    return function (data: any) {
      Logger.Info(`${appName} - socket event catched: '${service.event}'`);

      new Context(API_TYPES.SOCKET, {
        headers: socket.handshake ? socket.handshake.query : {},
        rid: data.rid || null,
        query: data.query,
        body: data.body,
        params: data.params,
        socket: socket,
        domain: data.domain,
        room: data.room,
        model: model,
        service: service,
        appName: appName || 'default',
        namespace: namespace || appName
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
    if (this.service.secure) {
      stackDetails.secure.should = 1;

      let Authentication = State.getModel('auth.users');
      if (Authentication)
        this._stack.push({ handler: (<any>Authentication).Authenticate.bind(Authentication), args: [] });
    }
    stackDetails.secure.actual = total = this._stack.length;

    this.logger.debug(`checking authorization layer with options: ${this.service.authorize}`);
    if (this.service.authorize) {
      stackDetails.authorize.should = 1;

      let Authorization = State.getModel('auth.authorization');
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
    this._stack.push({ handler: (<any>this.model)[this.service.__name].bind(this.model), args: [], mainHandler: true });
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

    this.logger.debug('checking extra hooks post after hooks');
    if (extraHooks && extraHooks.length && extraHooksPos === 1) {
      stackDetails.extra.should = extraHooks.length;
      this._stack.push(...extraHooks);
    }
    stackDetails.extra.actual = this._stack.length - total;
    total = this._stack.length;

    this.logger.debug('stack details:', JSON.stringify(stackDetails, null, 2));

    State.currentContext = this;
    this.logger.debug('running the stack');
    this.next();
  }

  private _mRespond(): void {
    this.response.apiType = this.apiType;
    this.response.code = this.response.code || RESPONSE_CODES.UNKNOWN_ERROR;
    this.response.domain = this.response.domain || this.service.domain || RESPONSE_DOMAINS.SELF;
    this.response.service = this.response.service || this.service.__name;
    this.response.rid = this._rid;

    this.logger.debug('sending response');

    if (this.apiType === API_TYPES.REST && this._res) {
      State.currentContext = null;

      if (this._resolve && this.response.success) {
        this._resolve(this.response);
      } else if (this._reject && !this.response.success) {
        this._reject(this.response);
      } else {
        this._res.status(this.response.code).json(this.response);
      }

    } else if (this._socket) {
      let event = `${this.model.name} ${this.service.crud}`;
      this.response.crud = this.service.crud;

      this.logger.debug(`dispatching event: '${event}' with domain: ${this.response.domain || this._domain || this.service.domain}, room: ${this.response.room}`);

      if (this.response.code < 200 || this.response.code >= 300) {
        this._socket.emit(event, this.response);

      } else {
        let domain = this.response.domain || this._domain || this.service.domain;
        let ns = State.ioNamespaces[this._namespace];
        this.response.room = this.room || this.response.room;

        if (this.response.domain === RESPONSE_DOMAINS.ROOM && this.response.room) {
          if (process && process.send)
            (<any>process).send({ data: this.response, target: 'others', action: 'response', namespace: this._namespace });

          if (ns)
            ns.to(this.response.room).emit(event, this.response);
          else
            this._socket.emit(event, this.response);

        } else if (this.response.domain === RESPONSE_DOMAINS.ALL) {
          if (process && process.send)
            (<any>process).send({ data: this.response, target: 'others', action: 'response', namespace: this._namespace });

          let io: any = State.ioNamespaces[this._namespace];

          if (ns)
            ns.emit(event, this.response);
          else
            this._socket.emit(event, this.response);

        } else {
          this._socket.emit(event, this.response);
        }
      }

      State.currentContext = null;

      if (this._resolve && this.response.success) {
        this._resolve(this.response);
      } else if (this._reject && !this.response.success) {
        this._reject(this.response);
      }
    }
  }

  private _mPushStack(hooksList: IHookOptions[]) {
    if (hooksList && hooksList.length)
      for (let hook of getHooks(this, hooksList))
        if (hook && hook.handler)
          this._stack.push(hook);
  }

  switchService(model: Model, serviceName: string, hooks: 'before' | 'after' | 'both' | 'none' = 'both', useOwnHooks: 0 | 1 | -1 = 0) {
    this.model = model;
    this.service = (<any>this.model)[stringUtil.capitalizeFirst(serviceName)];
    let extraHooks;

    if (useOwnHooks !== 0)
      extraHooks = this._stack;

    this._stack = [];
    this._mInit(hooks, extraHooks, useOwnHooks);
  }

  runService(model: Model, serviceName: string, data: IContextOptions = {}, user: any) {
    return new Promise((resolve, reject) => {

      let service = (<any>model)[stringUtil.capitalizeFirst(serviceName)];

      let context = new Context(this.apiType, {
        rid: model.name === this.model.name ? this._rid : null,
        headers: this.headers,
        query: data.query || this.query,
        body: data.body || this.body,
        params: data.params || this.params,
        cookies: data.cookies || this.cookies,
        req: this._req,
        res: this._res,
        appName: model.app.name,
        model: model,
        service: service
      }, false);

      context.user = user || this.user;
      context._resolve = resolve;
      context._reject = reject;

      context._mInit();
    })
      .then(response => {
        State.currentContext = this;
        return response;
      });
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
  get isMainHandler(): boolean {
    if (this._mainHandler) {
      this._mainHandler = false;
      return true;
    }

    return false;
  }

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

  private toggleRoom(action: 'join' | 'leave', rooms: string | string[], users?: string | string[]) {
    return new Promise((resolve, reject) => {
      if (!rooms) {
        rooms = [this.room];
      } else if (!Array.isArray(rooms)) {
        rooms = [rooms];
      }

      this.logger.info(`${action}ing room`);

      try {
        rooms.map((room: any) => typeof room === 'string' ? room : room.toString())
      } catch (err) {
        reject({
          message: `error ${action}ing room`,
          original: err,
          code: RESPONSE_CODES.BAD_REQUEST
        });
      }

      if (!users) {
        if (this.apiType === API_TYPES.SOCKET && this._socket)
          for (let room of rooms) {
            this._socket[action](room || this.room);
            this.logger.info(`socket: ${this._socket.id} ${action}ed room: ${room || this.room}`);

            return resolve(true);
          }

        reject({
          message: `invalid ${action} room options`,
          code: RESPONSE_CODES.BAD_REQUEST
        });

      } else {
        users = typeof users === "string" ? [users] : users;

        let usersModel = State.getModel<Users>('auth.users');

        usersModel.getSockets(users)
          .then(sockets => {
            let ns = State.ioNamespaces[this._namespace];

            if (ns) {
              let nsSockets = ns.sockets;
              for (let i = 0; i < sockets.length; i++) {
                let nsSockets = ns.sockets;

                if (nsSockets[sockets[i]]) {
                  for (let room of rooms)
                    if (room) {
                      nsSockets[sockets[i]][action](room);
                      this.logger.info(`socket: ${sockets[i]} ${action}ed room: ${room}`);
                    }

                  sockets.splice(i--, 1);
                }
              }
            }

            if (sockets.length)
              if (process && process.send)
                (<any>process).send({ data: { room: rooms, socketIds: sockets }, target: 'others', action: `${action} room`, namespace: this._namespace });

            resolve(true);

          })
          .catch(err => {
            reject({
              message: 'error getting users sockets',
              original: err,
              code: RESPONSE_CODES.UNKNOWN_ERROR
            });
          });
      }
    });
  }

  joinRoom(rooms: string | string[], users?: string | string[]) {
    return this.toggleRoom('join', rooms, users);
  }

  leaveRoom(rooms: string | string[], users?: string | string[]) {
    return this.toggleRoom('leave', rooms, users);
  }

  private getRealArgsValues(args: any[], hookName: string) {

    if (args && args.length) {
      for (let j = 0; j < args.length; j++) {
        if (typeof args[j] === 'string') {

          if (args[j].indexOf(',') > -1) {
            args[j] = args[j].split(',');
            for (let x = 0; x < args[j].length; x++)
              args[j][x] = getReference(this, args[j][x], hookName);
          } else {
            args[j] = getReference(this, args[j], hookName);
          }
        }
      }
    }

    return args;
  }

  next(err?: IResponseError): void {
    if (err) {
      console.trace(err);
      this.response = new Response({ error: new ResponseError(err), code: err.code });
      this._mRespond();

    } else {
      let current = this._stack.splice(0, 1)[0];

      if (current) {
        this.logger.debug(`running stack handler: ${(<any>current.handler).__name || current.handler.name}`);
        this._mainHandler = !!current.mainHandler;
        current.handler(this, ...this.getRealArgsValues(current.args, current.handler.name));
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

    this.response = res;
    this.next();
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

  for (let hook of list) {
    let args = typeof hook === 'string' ? hook.split(':') : (hook.args ? (Array.isArray(hook.args) ? hook.args : [hook.args]) : []);
    let hookName = typeof hook === 'string' ? args.shift().toLowerCase() : hook.name.toLowerCase();
    let handler: ((ctx: Context, ...args: any[]) => void) = null;

    if (hookName) {
      if (hookName.indexOf('.') > -1) {
        let appName, modelName, modelHookName;
        [appName, modelName, modelHookName] = hookName.split('.');

        let model = State.getModel(`${appName}.${modelName}`);

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

    yield <IStack>{ handler: handler, args: args || [] };
  }
}

function getReference(ctx: Context, name: string, hookName: string) {

  // if referencing a model
  if (name.charAt(0) === '@') {
    name = name.slice(1);
    let appName, modelName;
    [appName, modelName] = name.split('.');
    let model = State.getModel(name);

    if (!model) {
      ctx.logger.warn(`${hookName} hook: model '${modelName}' is not found`);
      return undefined;
    }

    let isPrivate = model.$get('private');

    if (!isPrivate) {
      ctx.logger.warn(`'${modelName}' is a private model`);
      return undefined;
    }

    return model;

    // referencing context properties locals, cookies, headers, query, body, response, or params
  } else if (name.charAt(0) === '$') {
    let parts = name.split('.');
    let targetName = parts[0].slice(1);

    if (targetName === 'locals')
      return ctx.get(parts[1]);
    else if (targetName === 'cookies')
      return ctx.cookies(parts[1]);
    else if (['headers', 'query', 'body', 'params', 'response'].indexOf(targetName) > -1) {
      parts.shift();
      return objectUtil.getValue((<any>ctx)[<string>targetName], parts.join('.'));
    } else
      return name;
  }

  return name;
}

function mimicService(name: string, options: IServiceOptions): IService {
  let service = <IService>{
    __name: name
  };

  objectUtil.extend(service, options);

  return service;
}