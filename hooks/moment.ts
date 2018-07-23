import * as Moment from 'moment';
import { getValue, setValue } from 'tools-box/object';
import { Context } from "../context";
import { Types } from 'validall';
import { Logger } from '../misc/logger';

function convert(src: any[], fields: string[], logger: Logger) {
  for (let i = 0; i < src.length; i++) {
    for (let j = 0; j < fields.length; j++) {
      let field = Array.isArray(fields[j]) ? fields[j] : [fields[j]];
      let srcField = field[0];
      let destField = field[1] || srcField;
      let method = field[2] || field[1] || 'from';

      if (['form', 'fromNow'].indexOf(method) === -1)
        method = 'from';

      if (srcField === '.' && typeof src[i] === 'string') {
        src[i] = (<any>Moment())[method](src[i]);

      } else if (Types.object(src[i])) {
        let srcValue = getValue(src[i], srcField);

        if (srcValue)
          setValue(src[i], destField, (<any>Moment())[method](srcValue));
        else
          logger.warn(`cannot find '${srcField}' in the response object`)
      } else {
        logger.warn(`input data does not match the response`);
      }
    }
  }
}

export function moment(ctx: Context, ...fields: string[]) {
  const logger = new Logger('moment');

  if (!fields || !fields.length)
    return ctx.next();

  let responseData = ctx.response.data;
  if (!responseData || (responseData && !responseData.length))
    return ctx.next();

  if (!Array.isArray(responseData))
    convert([responseData], fields, logger);
  else
    convert(responseData, fields, logger);

  ctx.next();
}