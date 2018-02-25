import * as Mongodb from 'mongodb'; 
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { MongoModel, FileModel } from '../models';
import { objectUtil } from '../util';
import { State } from '../state';
import { RESPONSE_CODES } from '../types';

export interface IReferenceHookOptions {
  path: string,
  model: string,
  projections?: { [key: string]: any };
}

export function reference (ctx: Context, options: IReferenceHookOptions) {
  const logger = new Logger('referenceHook');

  if (!options) {
    logger.warn('options was not provided!')
    return ctx.next();
  }

  let response = ctx.getResponseData();

  if (!response) {
    logger.warn('undefined response!');
    return ctx.next();
  }
    
  let model = <MongoModel>State.getModel(options.model);

  if (!model) {
    logger.warn(`'${options.model}' was not found`);
    return ctx.next();
  }

  let ids: string[] = [];

  if (Array.isArray(response) && response.length)
    for (let i = 0; i < response.length; i++) {
      let id = objectUtil.getValue(response[i], options.path);
      if (id)
        ids.push(id);
    }      

  if (!ids.length) {
    logger.warn(`'${options.path}' was not found in response data`);
    return ctx.next()
  }

  model.find({ _id: { $in: ids } })
    .then(res => {
      if (!res.data) {
        logger.warn(`${options.model} references were not found`);
        ctx.next();
      } else {
        for (let i = 0; i < ids.length; i++)
          for (let j = 0; j < res.data.length; j++) {
            if (ids[i] === res.data[j]._id)
              objectUtil.setValue(response[i], options.path, res.data[j]);

          }

        ctx.next();
      }
    })
    .catch(error => ctx.next({
      message: `error referencing ${options.model} with references '${ids}'`,
      original: error,
      code: RESPONSE_CODES.UNKNOWN_ERROR
    }));
}