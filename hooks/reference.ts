import * as Mongodb from 'mongodb';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { MongoModel, FileModel } from '../models';
import { objectUtil } from '../util';
import { State } from '../state';
import { RESPONSE_CODES } from '../types';

export interface IReferenceHookOptions {
  path: string,
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

  let model = <MongoModel>ctx.model;
  let idsList: string[] = [];
  let lookup: { [key: string]: any } = {};
  let groups: { [key: string]: string[] } = {}

  if (Array.isArray(response) && response.length)
    for (let i = 0; i < response.length; i++) {
      let ids = objectUtil.getValue(response[i], options.path);
      if (ids) {
        ids = Array.isArray(ids) ? ids : [ids];
        idsList.push(...ids);
        lookup[response[i]._id.toString()] = response[i];
        groups[response[i]._id.toString()] = ids;
      }
    }

  if (!idsList.length) {
    logger.warn(`'${options.path}' was not found in response data`);
    return ctx.next()
  }

  model.find({ _id: { $in: idsList } }, options.projections)
    .then(res => {
      if (!res.data) {
        logger.warn(`${model.name} references were not found`);
      } else if (Array.isArray(response)) {
        for (let i = 0; i < response.length; i++) {
          let currentId: string = response[i]._id;
          let group = groups[currentId];

          for (let j = 0; j < group.length; j++) {
            group[j] = res.data[i].find((item: any) => item._id === group[j]);
            objectUtil.injectValue(response[i], options.path, group);
          }
        }
      } else {
        let currentId: string = response._id;
        let group = groups[currentId];

        for (let j = 0; j < group.length; j++) {
          group[j] = res.data.find((item: any) => item._id === group[j]);
          objectUtil.injectValue(response, options.path, group);
        }
      }

      ctx.next();
    })
    .catch(error => ctx.next({
      message: `error referencing ${model.name} with references '${idsList}'`,
      original: error,
      code: RESPONSE_CODES.UNKNOWN_ERROR
    }));
}