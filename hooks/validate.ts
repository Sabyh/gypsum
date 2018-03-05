import * as Validall from 'validall';
import { Context } from '../context';
import { RESPONSE_CODES } from '../types';
import { Logger } from '../misc/logger';

export function validate(ctx: Context, schema: Validall.ISchema) {
  const logger = new Logger('validateHook');

  logger.info('checking args');
  logger.debug('schema:', schema);

  if (!schema) {
    return ctx.next({
      message: 'invalid schema',
      code: RESPONSE_CODES.BAD_REQUEST
    });
  }

  logger.info('args check passed');
  logger.info('looping args');

  let state = Validall(ctx, schema, { root: 'context', required: false, strict: false, filter: false });

  if (!state)
    return ctx.next({
      message: Validall.error.toString(),
      original: Validall.error,
      code: RESPONSE_CODES.UNAUTHORIZED
    });

  logger.info('all validations passed');
  ctx.next();
}