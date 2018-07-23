import { omit, pick } from 'tools-box/object';
import { Context } from '../context';
import { Logger } from '../misc/logger';

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
      srcData[i] = method === "omit" ? omit(srcData[i], fields) : pick(srcData[i], fields);
  else
    srcData = method === "omit" ? omit(srcData, fields) : pick(srcData, fields);

  logger.info('done filtering');
  logger.debug(`result data:`);
  ctx.next();
}