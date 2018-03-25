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
  app: string
  projections?: { [key: string]: any };
}

export function reference(ctx: Context, options: IReferenceHookOptions) {
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

  let model = <MongoModel>State.getModel(options.model, options.app);

  if (!model) {
    logger.warn(`'${options.model}' was not found`);
    return ctx.next();
  }

  let ids: string[] = [];
  let lookup: { [key: string]: any } = {};

  if (Array.isArray(response) && response.length)
    for (let i = 0; i < response.length; i++) {
      let id = objectUtil.getValue(response[i], options.path);
      if (id) {
        ids.push(id);
        lookup[id] = response[i];
      }
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
        for (let i = 0; i < res.data.length; i++) {
          let currentId: string = res.data[i]._id;
          objectUtil.setValue(lookup[currentId], options.path, res.data[i]);
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