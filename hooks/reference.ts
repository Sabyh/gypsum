import * as Mongodb from 'mongodb';
import * as Validall from 'validall';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { MongoModel, FileModel } from '../models';
import { objectUtil } from '../util';
import { State } from '../state';
import { RESPONSE_CODES } from '../types';
import { toObjectID } from '../util/toObjectId';

export interface IReferenceHookOptions {
  path: string,
  model: string,
  queryOptions?: any;
}

export function reference(ctx: Context, options: IReferenceHookOptions) {
  const logger = new Logger('referenceHook');
  let model: MongoModel, responseData: any;
  let idsList: string[] = [];
  let groups: { [key: string]: string[] } = {};

  if (!options) {
    logger.warn('options was not provided!')
    return ctx.next();
  }

  if (!options.model) {
    logger.warn('model name was not provided!')
    return ctx.next();
  }
  
  model = <MongoModel>State.getModel(options.model);

  if (!model) {
    logger.warn(`${options.model} model not found!.`);
    return ctx.next();
  }

  responseData = ctx.response.data;

  if (!responseData) {
    logger.warn('undefined response!');
    return ctx.next();
  }

  responseData = Array.isArray(responseData) ? responseData : [responseData];

  for (let i = 0; i < responseData.length; i++) {
    let ids = objectUtil.getValue(responseData[i], options.path);
    if (ids) {
      ids = Array.isArray(ids) ? ids : [ids];
      idsList.push(...ids);
      groups[responseData[i]._id.toString()] = ids;
    }
  }

  if (!idsList.length) {
    logger.warn(`'${options.path}' was not found in response data`);
    return ctx.next()
  }

  let query = toObjectID({ _id: { $in: idsList } });

  model.find(query, options.queryOptions || {})
    .then(res => {
      if (!res || !res.data || !res.data.length) {
        logger.warn(`${model.name} references were not found`);
        return ctx.next();
      }

      for (let i = 0; i < responseData.length; i++) {
        let currentId: string = responseData[i]._id;
        let group = groups[currentId];
        let references: any[] = res.data.filter((entry: any) => group.indexOf(entry._id.toString()) > -1);

        objectUtil.injectValue(responseData[i], options.path, references);
      }

      if (Array.isArray(ctx.response.data)) {
        if (!Array.isArray(objectUtil.getValue(ctx.response.data[0], options.path)))
          for (let i = 0; i < responseData.length; i++)
            objectUtil.injectValue(ctx.response.data[i], options.path, objectUtil.getValue(responseData[i], options.path)[0]);

      } else {
        if (!Array.isArray(objectUtil.getValue(ctx.response.data, options.path))) {
          objectUtil.injectValue(ctx.response.data, options.path, objectUtil.getValue(responseData[0], options.path)[0]);
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