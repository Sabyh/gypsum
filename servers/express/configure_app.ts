import * as express from 'express';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import { State } from '../../state';
import { searchQuery } from '../../middlewares/search-query';
import { Logger } from '../../misc/logger';
import { App } from '../../app';

export function configure(expressApp: express.Express, app?: App, logger?: Logger) {
  logger = logger || new Logger(app ? app.name : 'express');

  if (State.env === 'production')
    expressApp.use(compress());

  expressApp.use((req, res, next) => {
    logger.info(`request: ${req.method} - ${req.protocol}://${req.hostname}${req.originalUrl}`);
    if (app && 'onRequest' in app)
      (<any>app).onRequest(req, res, next);
    else
      next();
  });

  if (app) {
    if (app.name === 'root') {
      logger.info('impliminting express middlewares..');

      expressApp.use(cookieParser(State.config.cookie_key));
      expressApp.use(bodyParser.urlencoded({ extended: true }));
      expressApp.use(bodyParser.json({ limit: `${State.config.upload_size_limit_mb}mb` }));
      expressApp.use(methodOverride());
      expressApp.use(searchQuery);
    }

    if ('middlewares' in app) {
      (<any>app).middlewares(expressApp);
    }
  }

  expressApp.disable('x-powered-by');
}