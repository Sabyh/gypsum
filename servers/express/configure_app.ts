import * as express from 'express';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as methodOverride from 'method-override';
import { State } from '../../state';
import { searchQuery } from '../../middlewares/search-query';
import { Logger } from '../../misc/logger';

export function configure(app: express.Express, appName: string, logger?: Logger) {
  logger = logger || new Logger(appName);

  app.use((req, res, next) => {
    logger!.info(`request: ${req.method} - ${req.originalUrl}`);
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
}