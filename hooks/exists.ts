import { Context } from '../context';
import { MongoModel } from '../models';
import { RESPONSE_CODES } from '../types';
import { Logger } from '../misc/logger';
import { objectUtil } from '../util/index';

export function exists(ctx: Context, model: MongoModel, field: string) {
  const logger = new Logger('existsHook');

  if (!field)
    return ctx.next({
      message: `existsHook: field name should be specified`,
      code: RESPONSE_CODES.BAD_REQUEST
    });
    
  logger.info(`checking ${field} value`);
  let fieldValue = objectUtil.getValue(ctx.body, field);

  if (!fieldValue)
    return ctx.next({
      message: `existsHook: '${field}' is required`,
      code: RESPONSE_CODES.BAD_REQUEST
    });
  logger.info(`${field} value check passed`);

  const query: any = { [field]: fieldValue };

  logger.info(`checking model`);
  if (!model)
    ctx.next({
      message: `existsHook: undefined model`,
      code: RESPONSE_CODES.BAD_REQUEST
    });

  logger.info(`model check passed`);

  logger.info(`counting documents`);

  try {
    model.collection.count(query)
      .then(count => {
        logger.info(`counting results: ${count}`);

        if (count) {
          logger.info(`document exists`);
          ctx.next({
            message: `document with same ${field} already exists!`,
            code: RESPONSE_CODES.BAD_REQUEST
          });
        }

        logger.info(`document exist check passed`);
        ctx.next();
      });

  } catch (error) {
    ctx.next({
      message: 'existsHook: error counting documents',
      original: error,
      code: RESPONSE_CODES.UNKNOWN_ERROR
    });
  }
}