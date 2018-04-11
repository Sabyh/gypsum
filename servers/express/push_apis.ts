import * as path from 'path';
import * as express from 'express';
import * as cors from 'cors';
import { Model } from '../../models';
import { API_TYPES, RESPONSE_CODES, ResponseError, Response } from '../../types';
import { Logger } from '../../misc/logger';
import { Context } from '../../context';
import { State } from '../../state';
import { objectUtil } from '../../util';
import { IApp } from '../../config';
import { App } from '../../app';

export function pushApis(expressApp: express.Express, app: App) {
  const logger = new Logger(app.name);

  const router = express.Router();

  if (app.models) {

    for (let i = 0; i < app.models.length; i++) {
      let model: Model = app.models[i];

      logger.info(`Implementing ${model.name} model services`);  
      if (model.$get('apiType') === API_TYPES.SOCKET)
        continue;
  
      let corsOptions: cors.CorsOptions = {};
      let appCors = app.$get('cors');
      objectUtil.extend(corsOptions, appCors);
  
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
        router.options(services[service].path, cors(corsOptions));
        if (State.env === 'production')
          router[services[service].method](services[service].path, cors(corsOptions), Context.Rest(app.name, model, services[service]));
        else
          router[services[service].method](
            services[service].path,
            (req, res, next) => {
              logger.debug(`service request: (${req.method}) ${req.hostname}${req.path}`);
              next();
            },
            cors(corsOptions),
            Context.Rest(app.name, model, services[service])
          );

      }
    }
  }
  
  expressApp.use(router);

  expressApp.use((err: express.ErrorRequestHandler, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger!.error(err);
    console.trace(err);

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
}