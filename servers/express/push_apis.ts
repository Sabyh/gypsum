import * as path from 'path';
import * as express from 'express';
import * as cors from 'cors';
import { Model } from '../../models';
import { API_TYPES, RESPONSE_CODES, ResponseError, Response } from '../../types';
import { Logger } from '../../misc/logger';
import { Context } from '../../context';
import { State, IApplication } from '../../state';
import { objectUtil } from '../../util';
import { IApp } from '../../config';

export function pushApis(expressApp: express.Express, app: IApplication) {
  const logger = new Logger(app.name);

  logger.info('Implementing before middlwares for', app.name, 'app..');
  if (State.middlewares && State.middlewares[app.name] && State.middlewares[app.name].before && State.middlewares[app.name].before.length)
    for (let i = 0; i < State.middlewares[app.name].before.length; i++)
      State.middlewares[app.name].before[i](expressApp);

  const router = express.Router();

  if (app.models) {

    for (let i = 0; i < app.models.length; i++) {
      let model: Model = app.models[i];

      logger.info(`Implementing ${model.$get('name')} model services`);  
      if (model.$get('apiType') === API_TYPES.SOCKET)
        continue;
  
      let corsOptions: cors.CorsOptions = {};

      app.cors = app.cors ? objectUtil.extend(app.cors, State.config.cors) : State.config.cors;
      objectUtil.extend(corsOptions, app.cors)
  
      let modelCors = model.$get('cors');

      if (modelCors)
        objectUtil.extend(corsOptions, modelCors);
  
      let services = model.$getServices();
  
      for (let service in services) {
        if (services[service].apiType === API_TYPES.SOCKET)
          continue;
  
        let serviceCors = services[service].cors;

        if (serviceCors)
          objectUtil.extend(corsOptions, serviceCors);
  
        logger.info(`adding service for ${app.name} app: (${services[service].method}) - ${services[service].path}`);
        router[services[service].method](services[service].path, cors(corsOptions), Context.Rest(model, services[service]));
      }
    }
  }

  expressApp.use(State.config.services_prefix, router);

  logger.info('Implementing after middlwares..');
  if (State.middlewares && State.middlewares[app.name] && State.middlewares[app.name].after && State.middlewares[app.name].after.length)
    for (let i = 0; i < State.middlewares[app.name].after.length; i++)
      State.middlewares[app.name].after[i](expressApp);

  expressApp.use((err: express.ErrorRequestHandler, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

  let spa = app ? app.spa : State.config.spa;

  if (spa && spa.trim())
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(State.root, <string>spa));
    });
}