import * as path from 'path';
import * as express from 'express';
import { State } from '../../state';
import { Logger } from '../../misc/logger';
import { configure } from './configure_app';
import { pushApis } from './push_apis';
const vhost = require('vhost');

export function initExpress(app: express.Express) {
  const logger: Logger = new Logger('express');
  
  configure(app, 'express', logger);

  logger.info('Implementing statics..');
  if (State.config.statics && State.config.statics.length) {
    for (let i = 0; i < State.config.statics.length; i++) {
      let parts = State.config.statics[i].split(',');
      let fileName = parts[0];
      let prefix = parts[1] || '';
      logger.info(`static file path: '${path.join(State.root, fileName)}', static prefix: '${prefix}'`);
      app.use(prefix, express.static(path.join(State.root, fileName)));
    }
  }

  app.get('/gypsum-client.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.js'));
  });

  let apps = State.apps.filter(app => app.subdomain).map(app => ({ name: app.name, spa: app.spa }));

  if (apps.length) {
    for (let i = 0; i < State.apps.length; i++) {
      if (!State.apps[i].subdomain)
        continue;

      let subApp = express();
      configure(subApp, State.apps[i].name);
      pushApis(subApp, State.apps[i]);
      app.use(vhost(`${State.apps[i].name}.${State.config.host}`, subApp))
    }
  }

  let defaultApp = State.apps.find(_app => _app.name === 'default');
  
  if (defaultApp)
    pushApis(app, defaultApp);
}