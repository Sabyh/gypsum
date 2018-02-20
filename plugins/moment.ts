import * as Moment from 'moment';
import { Types } from 'validall';
import { Gypsum } from '../main';
import { Context } from '../context';
import { objectUtil } from '../util';
import { Logger } from '../misc/logger';

export function gypsumMoment() {

  const logger = new Logger('moment');

  function moment(ctx: Context, ...fields: string[]) {
    if (!fields || !fields.length)
      return ctx.next();

    let response = ctx.getResponseData();
    if (!response || (response && !response.length))
      return ctx.next();

    let data = [];
    if (!Array.isArray(response))
      data.push(response);
    else
      data = response;

    for (let i = 0; i < data.length; i++) {

      for (let i = 0; i < fields.length; i++) {
        let field = Array.isArray(fields[i]) ? fields[i] : [fields[i]];
        let srcField = field[0];
        let destField = field[1] || field[0];
        let method = field[2] || field[1] || 'from';

        if (['form', 'fromNow'].indexOf(method) === -1)
          method = 'from';

        if (srcField === '.' && typeof data[i] === 'string') {
          data[i] = (<any>Moment())[method](data[i]);
        } else if (Types.object(data[i])) {
          let srcValue = objectUtil.getValue(data[i], srcField);
          if (srcValue)
            objectUtil.setValue(data[i], destField, (<any>Moment())[method](srcValue));
          else
            logger.warn(`cannot find '${srcField}' in the response object`)
        } else {
          logger.warn(`input data does not match the response`);
        }
      }
    }

    ctx.setResponseData(data);
    ctx.next();
  }

  Gypsum.use({
    hooks: [moment]
  });
}