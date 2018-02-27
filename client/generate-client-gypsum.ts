import * as path from 'path';
import * as fs from 'fs';
import { State } from "../state";
import { stringUtil } from '../util';
import { RESPONSE_DOMAINS, API_TYPES } from '../types';

export function generateClientGypsum() {
  
  let configurations: any = {
    origin: State.config.origin,
    models: []
  };

  let apps = State.apps;
  let subDomains = apps.filter(app => app.subdomain).map(app => app.name);

  for (let i = 0; i < State.models.length; i++) {
    let model = State.models[i];
    let modelApp = model.$get('app') || 'default';
    let isSubdomain = subDomains.indexOf(modelApp) > -1;
    let isSecure = State.apps.filter(app => (app.name === modelApp && app.secure)).length;
    let modelServices = model.$getServices();
    let services: any = {};

    for (let prop in modelServices) {
      let service = modelServices[prop];
      let path = null;
      let event = null;
      
      if (service.apiType !== API_TYPES.SOCKET) {
        path = 'http' + (isSecure ? 's' : '') + '://';
        path += (isSubdomain ? (modelApp.toLowerCase() + '.') : '') + State.config.host;
        path += (State.env !== 'production') ? ':' + State.config.port : '';
        path += '/' + (State.config.services_prefix ? State.config.services_prefix : '');
        path += service.path;      
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

    configurations.models.push({
      app: modelApp.toLowerCase(),
      name: model.$get('name').toLowerCase(),
      services: services
    });
  }

  let template: any = fs.readFileSync(path.join(__dirname, 'template.js'));
  template = template.toString().replace(/\{\}\/\/\{\}/, JSON.stringify(configurations));
  fs.writeFileSync(path.join(__dirname, 'index.js'), template);
}