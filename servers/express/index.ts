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

  configure(app, State.apps[0]);
  pushApis(app, State.apps[0]);

  for (let i = 1; i < State.apps.length; i++) {
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