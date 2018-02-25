import * as express from 'express';
import { State } from './state';
import { Safe } from './misc/safe';
import { Logger } from './misc/logger';
import { Model } from './models';
import { IService, IHookOptions } from './decorators';
import { API_TYPES, RESPONSE_CODES, RESPONSE_DOMAINS, Response, ResponseError, IResponseError } from './types';
import { objectUtil } from './util/index';

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
  domain?: RESPONSE_DOMAINS;
  room?: string;
}

interface IStack {
  handler: (ctx: Context, ...args: any[]) => void;
  args: any[];
}

const contexts: Context[] = [];

export class Context {
  private _response: Response = <Response>{};
  private _socket: any | undefined;
  private _stack: IStack[] = [];
  private _locals: any = {};
  private _cookies: any;
  private _domain: RESPONSE_DOMAINS | undefined;
  private _room: string;
  
  readonly _req: express.Request | undefined;
  readonly _res: express.Response | undefined;

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
    this._room = data.room || '';
    this.apiType = type;
    this.headers = data.headers;
    this.query = data.query;
    this.body = data.body;
    this.params = data.params;
    this.model = data.model;
    this.service = data.service;
    this.logger = new Logger(this.service.name);
    

    this._mInit();
  }

  static Rest(model: Model, service: IService)
    : (req: express.Request, res: express.Response, next: express.NextFunction) => void {

    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
      contexts.push(new Context(API_TYPES.REST, {
        headers: req.headers,
        query: req.query,
        body: req.body,
        params: req.params,
        cookies: req.cookies,
        req: req,
        res: res,
        model: model,
        service: service
      }));
    }
  }

  static Socket(socket: any, model: Model, service: IService): (data: any) => void {
    return function (data: any) {
      contexts.push(new Context(API_TYPES.SOCKET, {
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
    }
  }

  static deleteContextsOf(type: string, identifier: string) {
    Logger.Info('Deleteing context of type:', type, ', identifier:', identifier);
    if (type === 'socket') {
      if (identifier)
        for (let i = 0; i < contexts.length; i++)
          if (contexts[i]._socket && contexts[i]._socket!.id === identifier)
            contexts.splice(i--, 1);

    } else if (type === 'model') {
      if (identifier)
        for (let i = 0; i < contexts.length; i++)
          if ((<any>contexts[i].model).__name === identifier)
            contexts.splice(i--, 1);
    }
  }

  private _mInit(hooks: 'before' | 'after' | 'both' | 'none' = 'both', extraHooks?: any[]): void {
    // Authentication Layer
    if (this.service.secure !== undefined && State.config.authenticationModelName) {
      let Authentication = State.getModel(State.config.authenticationModelName);
      if (Authentication)
        this._stack.push({ handler: (<any>Authentication).secure.bind(Authentication), args: [] });
    }

    if (this.service.authorize !== undefined && State.config.authorizationModelName) {
      let Authorization = State.getModel(State.config.authorizationModelName);
      if (Authorization)
        this._stack.push({ handler: (<any>Authorization).authorize.bind(Authorization), args: [this.service.authorize] });
    }

    if (this.service.validate)
      this._stack.push({ handler: <any>State.getHook('validate'), args: [this.service.validate] });

    // Pushing before hooks to the stack
    if ((hooks === 'both' || hooks === 'before') && this.service.before && this.service.before.length)
      this._mPushStack(this.service.before);

    // Pushing service to the stack
    this._stack.push({ handler: (<any>this.model)[this.service.__name].bind(this.model), args: [] });

    // Pushing after hooks to the stack
    if ((hooks === 'both' || hooks === 'after') && this.service.after && this.service.after.length)
      this._mPushStack(this.service.after);

    if (extraHooks && extraHooks.length)
      this._stack.push(...extraHooks);

    this.next();
  }

  private _mRespond(): void {
    this._response.apiType = this.apiType;
    this._response.code = this._response.code || RESPONSE_CODES.UNKNOWN_ERROR;

    if (this.apiType === API_TYPES.REST && this._res) {
      this._res.status(this._response.code).json(this._response);

    } else if (this._socket) {
      let event = this.service.event;

      if (this._response.code < 200 && this._response.code >= 300 ) {
        this._socket.emit(event, this._response);

      } else {
        let domain = this._response.domain || this._domain || this.service.domain;
        this._response.room = this._room || this._response.room;

        if (this._response.domain === RESPONSE_DOMAINS.ROOM && this._response.room) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response' })
          this._socket.to(this._response.room).emit(this._response.event, this._response);

        } else if (this._response.domain === RESPONSE_DOMAINS.ALL_ROOM && this._response.room) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response' })
          this._socket.broadcast.to(this._response.room).emit(this._response.event, this._response);

        } else if (this._response.domain === RESPONSE_DOMAINS.OTHERS) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response' })
          this._socket.broadcast.emit(this._response.event, this._response);

        } else if (this._response.domain === RESPONSE_DOMAINS.ALL) {
          if (process && process.send)
            (<any>process).send({ data: this._response, target: 'others', action: 'response' })
          let io: any = State[safe.get<'_io'>('State._io')];
          io.sockets.emit(this._response.event, this._response);

        } else {
          this._socket.emit(this._response.event, this._response);
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

  useService(model: Model, service: string, hooks: 'before' | 'after' | 'both' | 'none' = 'both', clearOwnHooks: boolean = false) {
    this.model = model;
    this.service = (<any>this.model)[service];
    let extraHooks;

    if (!clearOwnHooks)
      extraHooks = this._stack;

    this._stack = [];
    this._mInit(hooks, extraHooks);
  }

  useServiceHooks(service: IService, clearOwnHooks: boolean = false) {

    if (clearOwnHooks)
      this._stack = [];

    this._mPushStack(service.after);
  }

  get domain(): RESPONSE_DOMAINS { return <RESPONSE_DOMAINS>this._domain; }
  set domain(value: RESPONSE_DOMAINS) { this._domain = value; }
  get room(): string { return this._room; }

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

  joinRoom(roomName?: string): boolean {
    if (this.apiType === API_TYPES.SOCKET && this._socket)
      if (roomName || this._room) {
        this._socket.join(roomName || this._room);
        return true;
      }

    return false;
  }

  next(err?: IResponseError): void {
    if (err) {
      console.trace(err);
      this._response = new Response({ data: new ResponseError(err), code: err.code });
      this._mRespond();

    } else {
      let current = this._stack.splice(0, 1)[0];

      if (current)
        current.handler(this, ...current.args);
      else
        this._mRespond();
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
    let hookName = typeof hook === 'string' ? args.shift() : hook.name;
    let handler: ((ctx: Context, ...args: any[]) => void) | undefined = undefined;

    if (hookName) {
      if (hookName.indexOf('.') > -1) {
        let modelName, modelHook;
        [modelName, modelHook] = hookName.split('.');

        let model = State.getModel(modelName);

        if (model) {
          if (model.$hasHook(modelHook))
            if ((<any>model)[modelHook].private && modelName !== context.model.$get('name'))
              yield null;
            else
              handler = (<any>model)[modelHook].bind(model);
          else
            yield null;

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
    let model = State.getModel(name.slice(1));
    name = name.slice(1);

    if (!model) {
      ctx.logger.warn(`${hookName} hook: model '${name}' is not found`);
      return undefined;
    }

    let accessable = model.$get('accessable');
    let isAccessable = typeof accessable === 'boolean' ? accessable : accessable.indexOf(hookName) > -1;

    if (!isAccessable) {
      ctx.logger.warn(`model '${name}' is not accessable from '${hookName}' hook`)
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