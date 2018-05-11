import * as path from 'path';
import * as express from 'express';
import * as cors from 'cors';
import { State } from '../../state';
import { Logger } from '../../misc/logger';
import { configure } from './configure_app';
import { pushApis } from './push_apis';
import { App } from '../../app';
import { API_TYPES } from '../../types';
const vhost = require('vhost');

export function initExpress(app: express.Express) {
  const logger: Logger = new Logger('express');
  
  configure(app);
  
  if (State.config.statics && State.config.statics.length) {
    for (let i = 0; i < State.config.statics.length; i++) {
      let parts = State.config.statics[i].split(',');
      let fileName = parts[0];
      let prefix = parts[1] || '';
      logger.info(`static file path: '${path.join(State.root, fileName)}', static prefix: '${prefix}'`);
      app.use(prefix, express.static(path.join(State.root, fileName)));
    }
  }

  app.get('/getapp/:name', cors(), (req, res) => {
    let app = State.apps.find(_app => _app.name === req.params.name.toLowerCase());

    if (!app)
      return res.json(null);
    else
      res.json(app.$getApis());
  });

  app.get('/getapps/:names', cors(), (req, res) => {
    let appNames = req.params.names.split(',');
    let apis = [];

    for (let i = 0; i < appNames.length; i++) {
      let app = State.apps.find(_app => _app.name === appNames[i].toLowerCase());

      if (app) {
        apis.push(app.$getApis());
      }
    }

    return res.json(apis);
  });

  for (let i = 0; i < State.apps.length; i++) {
    if (State.apps[i].$get('apiType') === API_TYPES.SOCKET)
      continue;
      
    let subApp = express();
    configure(subApp, State.apps[i]);
    pushApis(subApp, State.apps[i]);
    app.use(vhost(`${State.apps[i].name}.${State.config.hostName}`, subApp));
  }

  if (State.config.spa && State.config.spa.trim())
    app.get('*', (req, res) => {
      res.sendFile(path.join(State.root, <string>State.config.spa));
    });
}