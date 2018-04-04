import { Logger } from '../misc/logger';
import { API_TYPES } from '../types';
import { FRIEND, IService, IModelHook, IHookOptions, IModelOptions } from '../decorators';
import { Safe } from '../misc/safe';
import { State } from '../state';
import { stringUtil } from '../util';

const safe = new Safe('model');

export type ServiceOptions = { [key: string]: IService | boolean };
export type getOptions = keyof IModelOptions;

export class Model {
  private _servicesData: { [key: string]: IService };
  private _hooksData: { [key: string]: IModelHook };
  
  public app: string;
  public type: 'Mongo' | 'File' | undefined;
  public $logger: Logger;
  public name = this.constructor.name.toLowerCase();

  constructor(appName: string) {
    this.app = appName;
  }

  private _mArrangeServices() {
    this._servicesData = {};
    let eliminationsList = this.$get('eliminate');

    if (this.$get('internal'))
      return;

    for (let prop in this) {

      let service: IService = <any>this[prop];      
      let isService = service && service.isService;
      
      if (service && isService) {

        if (eliminationsList.indexOf(prop) > -1) {
          delete this[prop];
          continue;
        }
        let serviceName = prop.toLowerCase();

        service.authorize = service.authorize === false ? false : service.authorize || this.$get('authorize');

        if (service.secure === undefined)
          if (service.authorize || this.$get('secure') || this.$get('authorize'))
            service.secure = true;

        this._servicesData[serviceName] = {
          __name: service.__name, 
          isService: isService,
          args: [],
          secure: service.secure,
          authorize: service.authorize,
          apiType: this.$get('apiType') === API_TYPES.ALL ? service.apiType : this.$get('apiType'),
          name: service.__name,
          event: this.name + ' ' + service.__name.toLowerCase(),
          method: service.method,
          path: createPath(service, this),
          params: service.params,
          domain: (!this.$get('domain') || this.$get('domain') > service.domain) ? service.domain : this.$get('domain'),
          before: [],
          after: [],
          validate: service.validate || null,
          cors: service.cors
        };

        if (this.$get('before') && this.$get('before').length)
          this._servicesData[serviceName].before = [...this.$get('before')];

        if (service.before && service.before.length) {
          if (service.before[0] === "~") {
            this._servicesData[serviceName].before = [...(service.before.slice(1))];
          } else {
            this._servicesData[serviceName].before.push(...service.before);
            cleanHooks(this._servicesData[serviceName].before)
          }
        }

        if (this.$get('after') && this.$get('after').length)
          this._servicesData[serviceName].after = [...this.$get('after')];

        // console.log(this.name, this._servicesData[serviceName].name, service.after);

        if (service.after && service.after.length) {
          if (service.after[0] === "~") {
            this._servicesData[serviceName].after = [...(service.after.slice(1))];
          } else {
            this._servicesData[serviceName].after.push('|', ...service.after);
            cleanHooks(this._servicesData[serviceName].after);

            let splitterIndex = this._servicesData[serviceName].after.indexOf('|');
            this._servicesData[serviceName].after = [
              ...this._servicesData[serviceName].after.slice(splitterIndex + 1),
              ...this._servicesData[serviceName].after.slice(0, splitterIndex)
            ];
          }
        }

      }
    }
  }

  private _mArrangeHooks() {
    this._hooksData = {};

    for (let prop in this) {
      if (this[prop] && (<any>this[prop]).isHook) {
        this._hooksData[prop.toLowerCase()] = <IModelHook>{};

        for (let key in this[prop])
          (<any>this._hooksData[prop.toLowerCase()])[key] = this[prop][key];
      }
    }
  }

  @FRIEND(safe.set('model.init', ['app']))
  protected init() {
    let modelName = this.name;

    this.$logger = new Logger(modelName);

    this._mArrangeServices();
    this._mArrangeHooks();
  }

  $get(prop: getOptions) {
    return (<any>this)[`__${prop}`] === undefined ? null : (<any>this)[`__${prop}`];
  }

  $getServices(): { [key: string]: IService } {
    return this._servicesData || this._mArrangeServices();
  }

  $getService(name: string): IService {
    return this._servicesData[name.toLowerCase()];
  }

  $getHooks(): { [key: string]: IModelHook } {
    return this._hooksData || this._mArrangeHooks();
  }

  $getHook(name: string): IModelHook {
    return this._hooksData[name.toLowerCase()];
  }

  $hasService(name: string): boolean {
    return this._servicesData[name.toLowerCase()].isService;
  }

  $hasHook(name: string): boolean {
    return this._hooksData.hasOwnProperty(name.toLowerCase()) && this._hooksData[name.toLowerCase()].isHook;
  }
}

function cleanHooks(hooks: IHookOptions[]) {
  for (let i = 0; i < hooks.length; i++) {
    let hook = hooks[i];
    let hookName = typeof hook === 'string' ? <string>hook.split(':')[0] : hook.name;
    let modifier = hookName.charAt(0);

    if (modifier === '-') {
      hookName = hookName.slice(1);
      hooks.splice(i--, 1);

      for (let j = 0; j <= i; j++) {
        let currentHookName = typeof hooks[j] === 'string' ? (<string>hooks[j]).split(':')[0] : (<any>hooks[j]).name;
        if (currentHookName === hookName) {
          hooks.splice(j--, 1);
          i--;
        }
      }

    } else if (modifier === '=') {
      hookName = hookName.slice(1);

      if (typeof hook === 'string')
        hooks[i] = (<string>hooks[i]).slice(1);
      else
        hook.name = hookName;

      for (let j = 0; j < i; j++) {
        let currentHookName = typeof hooks[j] === 'string' ? (<string>hooks[j]).split(':')[0] : (<any>hooks[j]).name;
        if (currentHookName === hookName) {
          hooks.splice(j--, 1);
          i--;
        }
      }
    }
  }
}

function createPath(service: IService, model: Model) {
  const skippedServicesNames = ['find', 'findbyid', 'insert', 'update', 'updatebyid', 'delete', 'deletebyid'];

  let path = `/${model.name}/`;

  if (skippedServicesNames.indexOf(service.__name.toLowerCase()) === -1)
    path += `/${service.__name.toLowerCase()}`;

  if (service.params && service.params.length)
    path += '/' + service.params.map(param => `:${param}`).join('/');

  return '/' + stringUtil.cleanPath(path);
}