import * as path from 'path';
import * as fs from 'fs';
import { State } from "../state";
import { stringUtil } from '../util';

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
    let servicesArr: any[] = [];

    for (let prop in modelServices) {
      let service = modelServices[prop];
      let path = 'http' + (isSecure ? 's' : '') + '://';

      path += (isSubdomain ? (modelApp + '.') : '') + State.config.host;
      path += (State.env !== 'production') ? ':' + State.config.port : '';
      path += '/' + (State.config.services_prefix ? State.config.services_prefix : '');
      path += service.path;      
      path = stringUtil.cleanPath(path);

      servicesArr.push({
        name: service.name,
        event: service.event,
        method: service.method,
        path: path
      });
    }

    configurations.models.push({
      app: model.$get('app'),
      name: model.$get('name'),
      services: servicesArr
    });
  }

  let template: any = fs.readFileSync(path.join(__dirname, 'template.js'));
  template = template.toString().replace(/\{\}\/\/\{\}/, JSON.stringify(configurations));
  fs.writeFileSync(path.join(__dirname, 'client.js'), template);
}