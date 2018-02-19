import * as path from 'path';
import * as express from 'express';
import { Model } from '../../models';
import { API_TYPES, RESPONSE_CODES, ResponseError } from '../../types';
import { Logger } from '../../misc/logger';
import { Context } from '../../context';
import { State } from '../../state';

export function pushApis(app: express.Express, appName: string = 'default', isSubDomain?: boolean, spa: string = '', logger?: Logger) {
  logger = logger || new Logger(appName);

  logger.info('Implementing before middlwares for', appName, 'app..');
  if (State.middlewares && State.middlewares[appName] && State.middlewares[appName].before && State.middlewares[appName].before.length)
    for (let i = 0; i < State.middlewares[appName].before.length; i++)
      State.middlewares[appName].before[i](app);

  const router = express.Router();

  for (let i = 0; i < State.models.length; i++) {
    let model: Model = State.models[i];
    let modelAppName = model.$get('app');

    if (isSubDomain) {
      if (modelAppName !== appName)
        continue;
    } else if (modelAppName !== appName) {
      if (State.apps.filter(app => (app.name === modelAppName && app.subdomain)).length > 0)
        continue;
    }

    if (model.$get('apiType') === API_TYPES.SOCKET)
      continue;

    let services = model.$getServices();

    for (let service in services) {
      if (services[service].apiType === API_TYPES.SOCKET)
        continue;

      logger.info(`adding service for ${appName} app: (${services[service].method}) - ${services[service].path}`);
      router[services[service].method](services[service].path, Context.Rest(model, services[service]));
    }
  }

  app.use(State.config.services_prefix, router);

  logger.info('Implementing after middlwares..');
  if (State.middlewares && State.middlewares[appName] && State.middlewares[appName].after && State.middlewares[appName].after.length)
    for (let i = 0; i < State.middlewares[appName].after.length; i++)
      State.middlewares[appName].after[i](app);

  app.use((err: express.ErrorRequestHandler, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger!.error(err);
    console.trace(err)

    if (err) {
      res.status(RESPONSE_CODES.UNKNOWN_ERROR).json(new Response({
        data: new ResponseError({ message: 'unkown error', original: err, code: RESPONSE_CODES.UNKNOWN_ERROR })
      }));
    } else {
      res.status(RESPONSE_CODES.NOT_FOUND).json(new Response({
        data: new ResponseError({ message: '404 not found!', original: err, code: RESPONSE_CODES.NOT_FOUND })
      }));
    }
  });

  if (spa && spa.trim())
    app.get('*', (req, res) => {
      res.sendFile(path.join(State.root, spa));
    });
}