import { IAppOptions, IAppKeys } from './decorators/app';
import { Model } from './models';
import { Safe } from './misc/safe';
import { API_TYPES } from './types';
import { State } from './state';
import { stringUtil } from './util';

const safe = new Safe('app');

export class App{
  models: Model[] = [];
  name = this.constructor.name.toLowerCase();

  init() {
    let models = this.$get('models');

    for (let i = 0; i < models.length; i++) {
      this.models.push(new models[i](this));
      this.models[i][<'init'>safe.get('model.init')]();
    }
  }

  $get(prop: IAppKeys) {
    return (<any>this)[`__${prop}`];
  }

  $getModel(name: string): Model {
    return this.models.find(model => model.name === name.toLowerCase()) || null;
  }

  $getApis() {
    let models: any[] = [];

    for (let i = 0; i < this.models.length; i++) {
      let model = this.models[i];
      let modelServices = model.$getServices();
      let services: any = {};

      for (let prop in modelServices) {
        let service = modelServices[prop];
        let path = null;
        let event = null;
        
        if (service.apiType !== API_TYPES.SOCKET) {
          path = 'http' + (State.config.secure ? 's' : '') + '://';
          path += this.name.toLowerCase() + '.' + State.config.hostName;
          path += (State.env !== 'production') ? ':' + State.config.port : '';
          path += '/' + service.path;      
          path = stringUtil.cleanPath(path);
        }
  
        if (service.apiType !== API_TYPES.REST)
          event = service.event;
  
        services[service.__name.toLowerCase()] = {
          name: service.__name.toLowerCase(),
          event: event,
          method: service.method,
          path: path
        };
      }

      models.push({
        name: model.name.toLowerCase(),
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
}