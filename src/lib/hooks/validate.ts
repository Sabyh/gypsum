import * as Validall from 'validall';
import { Context } from '../context';
import { RESPONSE_CODES } from '../types';
import { Logger } from '../misc/logger';

export function validate(ctx: Context, args: { [key: string]: Validall.ISchema }) {
  const logger = new Logger('validateHook');

  logger.info('checking args');
  logger.debug('args:', args);

  if (!args) {
    return ctx.next({
      message: 'invalid args',
      code: RESPONSE_CODES.BAD_REQUEST
    });
  }

  logger.info('args check passed');
  logger.info('looping args');
  for (let prop in args) {
    if (['query', 'body', 'user'].indexOf(prop) === -1)
      return ctx.next({
        message: `validating context.${prop} is not allowed`,
        code: RESPONSE_CODES.BAD_REQUEST
      });

    logger.info(`validating ${prop}`);
    if (!Validall((<any>ctx)[prop], args[prop], { root: prop, required: true })) {
      logger.info(`validating ${prop} faild`);
      logger.debug(`validation error`, Validall.error);
      return ctx.next({
        message: Validall.error.toString(),
        original: Validall.error,
        code: RESPONSE_CODES.UNAUTHORIZED
      });
    }

    logger.info(`validating ${prop} passed`);
  }

  logger.info('all validations passed');
  ctx.next();
}