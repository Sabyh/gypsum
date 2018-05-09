import { Logger } from '../misc/logger';
import { API_TYPES } from '../types';
import { FRIEND, IService, IModelHook, IHookOptions, IModelOptions } from '../decorators';
import { Safe } from '../misc/safe';
import { State } from '../state';
import { stringUtil } from '../util';
import { App } from '../app';

const safe = new Safe('model');

export type ServiceOptions = { [key: string]: IService | boolean };
export type getOptions = keyof IModelOptions;

export class Model {
  private _servicesData: { [key: string]: IService };
  private _hooksData: { [key: string]: IModelHook };

  public app: App;
  public type: 'Mongo' | 'File' | undefined;
  public $logger: Logger;
  public name = this.constructor.name.toLowerCase();

  constructor(app: App) {
    this.app = app;
  }

  private _mArrangeServices(): { [key: string]: IService } {
    this._servicesData = {};

    if (this.$get('internal'))
      return {};

    for (let prop in this) {

      /**
       * Checking if method is a service
       */
      let service: IService = <any>this[prop];
      let isService = service && service.isService;

      if (service && isService) {
        let servicesOptions = this.$get('servicesOptions');

        /**
         * Checking if service is cancelled
         */
        if (servicesOptions[prop] === false) {
          delete this[prop];
          continue;
        }

        let serviceName = prop.toLowerCase();

        /**
         * Checking service authorization
         */
        if (servicesOptions[prop] && servicesOptions[prop].authorize !== undefined) {
          service.authorize = servicesOptions[prop].authorize;
        } else {
          service.authorize = service.authorize === false ? false : service.authorize || this.$get('authorize');
        }

        /**
         * Checking service authentication
         */
        if (service.authorize) {
          service.secure = true;
        } else if (servicesOptions[prop] && servicesOptions[prop].secure !== undefined) {
          service.secure = servicesOptions[prop].secure;
        } else {
          service.secure = service.secure === false ? false : service.secure || this.$get('secure');
        }

        this._servicesData[serviceName] = {
          __name: service.__name,
          isService: isService,
          args: [],
          secure: service.secure,
          authorize: service.authorize,
          apiType: this.$get('apiType') === API_TYPES.ALL ? service.apiType : this.$get('apiType'),
          name: service.__name,
          event: `${this.app.name} ${this.name} ${service.__name.toLowerCase()}`,
          method: service.method,
          crud: service.crud,
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

        let serviceBeforeHooks;

        if (servicesOptions[prop] && servicesOptions[prop].before && servicesOptions[prop].before.length)
          serviceBeforeHooks = servicesOptions[prop].before;
        else if (service.before && service.before.length) {
          serviceBeforeHooks = service.before;
        }

        if (serviceBeforeHooks && serviceBeforeHooks.length) {
          if (serviceBeforeHooks[0] === "~") {
            this._servicesData[serviceName].before = [...(serviceBeforeHooks.slice(1))];
          } else {
            this._servicesData[serviceName].before.push(...serviceBeforeHooks);
            cleanHooks(this._servicesData[serviceName].before)
          }
        }

        if (this.$get('after') && this.$get('after').length)
          this._servicesData[serviceName].after = [...this.$get('after')];

        let serviceAfterHooks;

        if (servicesOptions[prop] && servicesOptions[prop].after && servicesOptions[prop].after.length)
          serviceAfterHooks = servicesOptions[prop].after;
        else if (service.after && service.after.length) {
          serviceAfterHooks = service.after;
        }

        if (serviceAfterHooks && serviceAfterHooks.length) {
          if (service.after[0] === "~") {
            this._servicesData[serviceName].after = [...(serviceAfterHooks.slice(1))];
          } else {
            this._servicesData[serviceName].after.push('|', ...serviceAfterHooks);
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

    return this._servicesData;
  }

  private _mArrangeHooks(): { [key: string]: IModelHook } {
    this._hooksData = {};

    for (let prop in this) {
      if (this[prop] && (<any>this[prop]).isHook) {
        this._hooksData[prop.toLowerCase()] = <IModelHook>{};

        for (let key in this[prop])
          (<any>this._hooksData[prop.toLowerCase()])[key] = this[prop][key];
      }
    }

    return this._hooksData;
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
  let path = `/${model.name}/${service.__name.toLowerCase()}`;

  if (service.params && service.params.length)
    path += '/' + service.params.map(param => `:${param}`).join('/');

  return '/' + stringUtil.cleanPath(path);
}