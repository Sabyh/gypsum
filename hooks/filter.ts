import { objectUtil } from '../util/object';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { Response } from '../types';

export function filter(ctx: Context, fields: string | string[], source?: string) {
  const logger = new Logger('filterHook');
  let srcData: any;
  
  logger.debug('fields passed', fields);

  if (!fields || !fields.length)
    ctx.next();

  fields = Array.isArray(fields) ? fields : [fields];

  logger.info('checking source data');
  if (source === 'query' || source === 'body')
    srcData = ctx[source];
  else
    srcData = ctx.response.data;

  if (!srcData || typeof srcData !== 'object')
    return ctx.next();

  logger.info('source data check passed');
  logger.info('checking filter method');
  let method: 'pick' | 'omit' = 'pick';

  if (fields[0].charAt(0) === '-') {
    method = 'omit';
    fields[0] = fields[0].slice(1);
  }

  logger.info(`method: ${method}`);
  logger.info('filtering data');
  if (Array.isArray(srcData))
    for (let i = 0; i < srcData.length; i++)
      srcData[i] = objectUtil[method](srcData[i], fields);
  else
    srcData = objectUtil[method](srcData, fields);

  logger.info('done filtering');
  logger.debug(`result data:`);
  console.dir(srcData);
  ctx.next();
}