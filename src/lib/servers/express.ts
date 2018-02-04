import * as path from 'path';
import * as express from 'express';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import { State } from '../state';
import { Response, ResponseError, RESPONSE_CODES, API_TYPES } from '../types';
import { Context } from '../context';
import { Model } from '../model/model';
import { Logger } from '../misc/logger';
import { searchQuery } from '../middlewares/search-query';

export function initExpress(app: express.Express) {
  const logger = new Logger('express');

  app.use((req, res, next) => {
    logger.info(`request: ${req.method} - ${req.originalUrl}`);
    next();
  });

  logger.info('impliminting express middlewares..');

  if (State.env === 'production')
    app.use(compress());

  app.use(cookieParser(State.config.cookie_key));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: `${State.config.upload_size_limit_mb}mb` }));
  app.use(methodOverride());
  app.use(searchQuery);
  app.disable('x-powered-by');

  logger.info('Implementing before middlwares..');
  if (State.middlewares.before.length)
    for (let i = 0; i < State.middlewares.before.length; i++)
      State.middlewares.before[i](app);

  logger.info('Implementing rest services..');
  if (State.models && State.models.length) {
    let models = State.models;

    for (let i = 0; i < models.length; i++) {
      let model: Model = models[i];

      if (model.$get('apiType') === API_TYPES.SOCKET)
        continue;

      let services = model.$getServices();

      for (let service in services) {
        if (services[service].apiType === API_TYPES.SOCKET)
          continue;

        logger.info(`adding service: (${services[service].method}) - ${services[service].path}`);
        State.router[services[service].method](services[service].path, Context.Rest(model, services[service]));
      }
    }

    app.use(State.config.services_prefix, State.router);
  }


  logger.info('Implementing static..');
  if (State.config.static_dir)
    app.use(<string>State.config.static_prefix || "", express.static(path.join(State.root, State.config.static_dir)));

  logger.info('Implementing after middlwares..');
  if (State.middlewares.after.length)
    for (let i = 0; i < State.middlewares.after.length; i++)
      State.middlewares.after[i](app);

  app.use((err: express.ErrorRequestHandler, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err);
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
}