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

  let id = objectUtil.getValue(response, options.path);

  if (!id) {
    logger.warn(`'${options.path}' was not found in response data`);
    return ctx.next();
  }
    
  let model = <MongoModel>State.getModel(options.model);

  if (!model) {
    logger.warn(`'${options.model}' was not found`);
    return ctx.next();
  }

  model.collection.findOne({ _id: new Mongodb.ObjectID(id) })
    .then(doc => {
      if (!doc) {
        logger.warn(`${options.model} with reference '${id}' was not found`);
        ctx.next();
      } else {
        objectUtil.setValue(response, options.path, doc);
        ctx.next();
      }
    })
    .catch(error => ctx.next({
      message: `error referencing ${options.model} with reference '${id}'`,
      original: error,
      code: RESPONSE_CODES.UNKNOWN_ERROR
    }));
}