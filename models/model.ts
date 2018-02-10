import { Logger } from '../misc/logger';
import { API_TYPES } from '../types';
import { FRIEND, IService, IHook, IHookOptions } from '../decorators';
import { Safe } from '../misc/safe';

const safe = new Safe('model');

export type ServiceOptions = { [key: string]: IService | boolean };
export type getOptions = 'name' | 'secure' | 'authorize' | 'accessable' | 'internal' | 'eliminate' | 'apiType' | 'before' | 'after' | 'schema' | 'schemaOptions' | 'domain' | 'indexes';

const skippedServicesNames = ['find', 'findById', 'insert', 'update', 'updateById', 'delete', 'deleteById'];

export class Model {
  private _servicesData: { [key: string]: IService };
  private _hooksData: { [key: string]: IHook };

  public type: 'Mongo' | 'File' | undefined;
  public $logger: Logger;

  static createPath(service: IService, prefix: string = ""): string {
    let path = (prefix ? `/${prefix}` : "") + "/" + (service.path || (skippedServicesNames.indexOf(service.name) > -1 ? '' : service.name));

    if (service.params.length)
      for (let i = 0; i < service.params.length; i++)
        path += `/:${service.params[i]}`;

    return path.replace(/\/{2,}/g, '/');
  }

  private _mArrangeServices() {
    this._servicesData = {};
    let eliminationsList = this.$get('eliminate');

    for (let prop in this) {
      
      let service: IService = <any>this[prop];
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
          apiType: this.$get('apiType') === API_TYPES.ALL ? service.apiType : this.$get('apiType'),
          name: service.name,
          event: `${this.$get('name')} ${service.event}`,
          method: service.method,
          path: Model.createPath(service, this.$get('name')),
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
          } else {
            this._servicesData[prop].before.push(...service.before);
            cleanHooks(this._servicesData[prop].before)
          }
        }

        if (this.$get('after') && this.$get('after').length)
          this._servicesData[prop].after = [...this.$get('after')];

        if (service.after && service.after.length) {
          if (service.after[0] === "~") {
            this._servicesData[prop].after = [...(service.after.slice(1))];
          } else {
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

  private _mArrangeHooks() {
    this._hooksData = {};

    for (let prop in this) {
      if (this[prop] && (<any>this[prop]).isHook) {
        this._hooksData[prop] = <IHook>{};

        for (let key in this[prop])
          (<any>this._hooksData[prop])[key] = this[prop][key];
      }
    }
  }

  @FRIEND(safe.set('model.init', ['main']))
  protected init() {
    this.$logger = new Logger(this.$get('name'));

    this._mArrangeServices();
    this._mArrangeHooks();
  }

  $get(prop: getOptions) {
    if (prop === 'name')
      return this.constructor.name;
    else
      return (<any>this)[`__${prop}`] === undefined ? null : (<any>this)[`__${prop}`];
  }

  $getServices(): { [key: string]: IService } {
    return this._servicesData || this._mArrangeServices();
  }

  $getService(name: string): IService {
    return this._servicesData[name];
  }

  $getHooks(): { [key: string]: IHook } {
    return this._hooksData || this._mArrangeHooks();
  }

  $hasService(name: string): boolean {
    return this._servicesData.hasOwnProperty(name) && this._servicesData[name].isService;
  }

  $hasHook(name: string): boolean {
    return this._hooksData.hasOwnProperty(name) && this._hooksData[name].isHook;
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