import { IAppKeys } from './decorators/app';
import TB from 'tools-box';
import { Model } from './models';
import { API_TYPES } from './types';
import { State } from './state';
import { gypsumEmitter, GypsumEmitter } from './emitter';
import { Logger } from './misc/logger';
import { processManger } from './process-manager';
import { IHook } from './decorators';

export class App {
  private _models: Model[] = [];
  private _hooksData: { [key: string]: IHook };

  public emitter = new GypsumEmitter();
  public name = this.constructor.name.toLowerCase();
  public $logger = new Logger(this.name);

  constructor() {
    gypsumEmitter.on('initialize apps', () => this._init());
  }

  private _init() {
    let models = this.$get('models');

    for (let i = 0; i < models.length; i++) {
      this._models.push(new models[i](this));
    }

    this._mArrangeHooks();
    this._mArrangeProcesses();
    gypsumEmitter.emit(`${this.name} ready`);
  }

  private _mArrangeHooks(): { [key: string]: IHook } {
    this._hooksData = {};

    for (let prop in this) {
      if (this[prop] && (<any>this[prop]).isHook) {
        this._hooksData[prop.toLowerCase()] = <IHook>{};

        for (let key in this[prop])
          (<any>this._hooksData[prop.toLowerCase()])[key] = this[prop][key];
      }
    }

    return this._hooksData;
  }

  private _mArrangeProcesses() {
    for (let prop in this)
    if (this[prop] && (<any>this[prop]).isProcess)
    processManger.registerProcess(this, <any>this[prop]);
  }

  get publicModels(): Model[] {
    return this._models.filter(model => !model.$get('internal'));
  }

  $get(prop: IAppKeys) {
    return (<any>this)[`__${prop}`];
  }

  $getModel(name: string): Model {
    let model = this._models.find(model => model.name === name.toLowerCase());
    if (!model || model.$get('private'))
      return null;

    return model;
  }

  $hasModel(name: string): boolean {
    return this._models.findIndex(model => model.name === name.toLowerCase()) > -1;
  }

  $getHooks(): { [key: string]: IHook } {
    return this._hooksData || this._mArrangeHooks();
  }

  $getHook(name: string): IHook {
    return this._hooksData[name.toLowerCase()];
  }

  $getApis() {
    let models: any[] = [];

    for (let i = 0; i < this._models.length; i++) {
      let model = this._models[i];
      let modelServices = model.$getServices();
      let services: any = {};

      for (let prop in modelServices) {
        let service = modelServices[prop];
        let path = null;
        let crud = null;
        
        if (service.apiType !== API_TYPES.SOCKET) {
          path = 'http' + (State.config.secure ? 's' : '') + '://';
          path += this.name.toLowerCase() + '.' + State.config.hostName;
          path += (State.env !== 'production') ? ':' + State.config.port : '';
          path += '/' + service.path;      
          path = TB.cleanPath(path);
        }
  
        if (service.apiType !== API_TYPES.REST)
          crud = service.crud;
  
        services[service.__name.toLowerCase()] = {
          name: service.__name.toLowerCase(),
          crud: crud,
          method: service.method,
          path: path
        };
      }

      let modelSchema = model.$get('schema');

      models.push({
        name: model.name.toLowerCase(),
        schema: modelSchema ? modelSchema.schema : null,
        services: services
      });
    }

    return {
      name: this.name,
      apiType: this.$get('apiType'),
      namespaces: this.$get('namespaces'),
      models: models
    }
  }

  $getMap() {
    let map = [];
    if (this._models && this._models.length) {
      for (let i = 0; i < this._models.length; i++) {
        let modelName = this._models[i].name;
        let services = this._models[i].$getServices();
        let serviceNames = Object.keys(services);

        if (serviceNames.length) {
          for (let name in serviceNames)
            map.push(`${this.name}.${modelName}.${name}`);
        }
      }
    }

    return map;
  }
}