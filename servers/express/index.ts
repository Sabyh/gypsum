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

  let subDomains = State.apps.filter(app => app.subdomain).map(app => ({ name: app.name, spa: app.spa }));

  if (subDomains.length) {
    for (let i = 0; i < subDomains.length; i++) {
      let subApp = express();
      configure(subApp, subDomains[i].name);
      pushApis(subApp, subDomains[i].name, true, subDomains[i].spa);
      app.use(vhost(`${subDomains[i].name}.${State.config.host}`, subApp))
    }
  }

  pushApis(app, 'default', false, State.config.spa, logger);
}