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

  for (let j = 0; j < State.apps.length; j++) {
    let app = State.apps[j];

    if (app.models && app.models.length) {

      for (let i = 0; i < app.models.length; i++) {
        let model = app.models[i];
        let modelServices = model.$getServices();
        let services: any = {};

        for (let prop in modelServices) {
          let service = modelServices[prop];
          let path = null;
          let event = null;
          
          if (service.apiType !== API_TYPES.SOCKET) {
            path = 'http' + (app.secure ? 's' : '') + '://';
            path += (app.subdomain ? (app.name.toLowerCase() + '.') : '') + State.config.host;
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
          app: app.name.toLowerCase(),
          name: model.$get('name').toLowerCase(),
          services: services
        });
      }
    }
  }

  let template: any = fs.readFileSync(path.join(__dirname, 'template.js'));
  template = template.toString().replace(/\{\}\/\/\{\}/, JSON.stringify(configurations));
  fs.writeFileSync(path.join(__dirname, 'index.js'), template);
}