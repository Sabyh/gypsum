import { hash as _hash } from '../util/crypt';
import { objectUtil } from '../util/object';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { RESPONSE_CODES } from '../types';

const defaultOptions = {
  fieldPath: 'password',
  savePath: 'password',
  saltSavePath: '',
  source: 'body'
};

export function hash(ctx: Context, options: any) {
  const logger = new Logger('hashHook');
  let srcData: any;
  let fieldValue: string;

  options = Object.assign({}, defaultOptions, options);
  options.saltSavePath = options.saltSavePath || `${options.savePath}Salt`;

  if (options.source === 'query' || options.source === 'body')
    srcData = (<any>ctx)[options.source];
  else
    srcData = ctx.getResponseData();

  fieldValue = objectUtil.getValue(srcData, options.fieldPath);
  if (!fieldValue || typeof fieldValue !== 'string')
    return ctx.next({
      message: `${options.fieldPath} must have a string value`,
      code: RESPONSE_CODES.BAD_REQUEST
    });

  logger.info('collecting data');
  if (!srcData || !srcData[options.fieldPath])
    return ctx.next();
  
  logger.debug(options.fieldPath, 'has value of:', ctx.body[options.fieldPath]);
  logger.info('incrypting', options.fieldPath);
  _hash(srcData[options.fieldPath])
    .then(results => {
      logger.info('incrypting passed');
      logger.debug('saving', options.fieldPath, 'in', options.savePath);
      objectUtil.injectValue(srcData, options.savePath, results[0]);
      logger.debug('saving', options.fieldPath, 'in', options.savePath + 'Salt');
      objectUtil.injectValue(srcData, options.saltSavePath, results[1]);
      ctx.next();
    })
    .catch(error => ctx.next({
      message: `error hashing '${options.fieldPath}'`,
      original: error,
      code: RESPONSE_CODES.UNKNOWN_ERROR
    }));



}