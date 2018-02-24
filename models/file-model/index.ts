import * as Validall from 'validall';
import { FileCollection } from './collection';
import { Model } from '../model';
import { Context } from '../../context';
import { IResponseError, RESPONSE_CODES, IResponse } from '../../types';
import { SERVICE } from '../../decorators';

export class FileModel extends Model {
  protected collection: FileCollection;

  constructor() {
    super();
    this.collection = new FileCollection(this.$get('name'), this.$get('schema'));
    this.type = 'File';
  }

  @SERVICE({
    args: ['query.query', 'query.projections', 'query.options']
  })
  find(query: any = {}, projections: string, options: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('find service called');
      this.$logger.debug('query:', query);
      this.$logger.debug('projections:', projections);
      this.$logger.debug('options:', options);

      this.collection.find(query, projections, options)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['params.id', 'query.projections']
  })
  findById(id: string, projections: string): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('findById service called');
      this.$logger.debug('id:', id);
      this.$logger.debug('projections:', projections);

      this.collection.findById(id, projections)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['query.query', 'query.projections']
  })
  findOne(query: any, projections: string): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('findOne service called');
      this.$logger.debug('query:', query);
      this.$logger.debug('projections:', projections);

      this.collection.findById(query, projections)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['query.query']
  })
  count(query: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('count service called');
      this.$logger.debug('query:', query);

      this.collection.count(query)
        .then(res => resolve({ data: res, count: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['body.query', 'body.projections', 'body.options']
  })
  search(query: any, projections: string, options: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('search service called');
      this.$logger.debug('query:', query);
      this.$logger.debug('projections:', projections);
      this.$logger.debug('options:', options);
  
      this.collection.find(query, projections, options)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['body.documents']
  })
  insert(documents: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {

      this.$logger.info('insert service called');
      this.$logger.debug('documents:', documents);

      this.collection.insert(documents)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.update', 'body.options']
  })
  update(filter: any, update: any, options: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('update service called');
      this.$logger.debug('filter:', filter);
      this.$logger.debug('update:', update);
      this.$logger.debug('options:', options);

      this.collection.update(filter, update, options)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['params.id', 'body.update']
  })
  updateById(id: string, update: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('update service called');
      this.$logger.debug('id:', id);
      this.$logger.debug('update:', update);

      this.collection.updateById(id, update)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.update']
  })
  updateOne(filter: any, update: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('update service called');
      this.$logger.debug('filter:', filter);
      this.$logger.debug('update:', update);

      this.collection.updateOne(filter, update)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.options']
  })
  delete(filter: any, options: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('delete service called');
      this.$logger.debug('filter:', filter);
      this.$logger.debug('filter:', options);

      if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
        return reject({
          message: `[${this.$get('name')}] - delete: unsecure process rejection`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      this.collection.delete(filter, options)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['params.id']
  })
  deleteById(id: string): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('deleteById service called');
      this.$logger.debug('id:', id);

      if (!id)
        return reject({
          message: `[${this.$get('name')}] - deleteById: document id is required.`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      this.collection.deleteById(id)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }

  @SERVICE({
    args: ['body.filter']
  })
  deleteOne(filter: any): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.$logger.info('deleteOne service called');
      this.$logger.debug('filter:', filter);
  
      if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
        return reject({
          message: `[${this.$get('name')}] - deleteOne: unsecure process rejection`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });
  
      this.collection.deleteById(filter)
        .then(res => resolve({ data: res }))
        .catch((error: IResponseError) => reject(error));
    });
  }
}