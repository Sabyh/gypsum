import * as Validall from 'validall';
import { FileCollection } from './collection';
import { Model } from '../model';
import { Context } from '../../context';
import { IResponseError, RESPONSE_CODES } from '../../types';
import { SERVICE } from '../../decorators';

export class FileModel extends Model {
  public collection: FileCollection;

  constructor() {
    super();
    this.collection = new FileCollection(this.$get('name'), { schema: this.$get('schema'), schemaOptions: this.$get('schemaOptions')});
    this.type = 'File';
  }

  @SERVICE()
  find(ctx: Context) {
    this.$logger.info('find service called');
    this.$logger.debug('query:', ctx.query.query);
    this.$logger.debug('projection:', ctx.query.projection);
    this.$logger.debug('options:', ctx.query.options);

    this.collection.find(ctx.query.query, ctx.query.projection, ctx.query.options)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  findById(ctx: Context) {
    this.$logger.info('findById service called');
    this.$logger.debug('id:', ctx.params.id);
    this.$logger.debug('projections:', ctx.query.projections);

    this.collection.findById(ctx.params.id, ctx.query.projections)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  findOne(ctx: Context) {
    this.$logger.info('findOne service called');
    this.$logger.debug('query:', ctx.query.query);
    this.$logger.debug('projections:', ctx.query.projections);

    this.collection.findById(ctx.query.query, ctx.query.projections)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  count(ctx: Context) {
    this.$logger.info('count service called');
    this.$logger.debug('query:', ctx.query.query);

    this.collection.count(ctx.query.query)
      .then(res => ctx.ok(res, res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  search(ctx: Context) {
    this.$logger.info('search service called');
    this.$logger.debug('query:', ctx.body.query);
    this.$logger.debug('projections:', ctx.body.projections);
    this.$logger.debug('options:', ctx.body.options);

    this.collection.find(ctx.body.query, ctx.body.projections, ctx.body.option)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  insert(ctx: Context) {
    this.$logger.info('insert service called');
    this.$logger.debug('documents:', ctx.body);

    this.collection.insert(ctx.body)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  insertOne(ctx: Context) {
    this.$logger.info('insertOne service called');
    this.$logger.debug('document:', ctx.body);

    this.collection.insert(ctx.body)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  update(ctx: Context) {
    this.$logger.info('update service called');
    this.$logger.debug('filter:', ctx.body.filter);
    this.$logger.debug('update:', ctx.body.update);
    this.$logger.debug('options:', ctx.body.options);

    this.collection.update(ctx.body.filter, ctx.body.update, ctx.body.options)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  updateById(ctx: Context) {
    this.$logger.info('update service called');
    this.$logger.debug('id:', ctx.params.id);
    this.$logger.debug('update:', ctx.body.update);
    this.$logger.debug('options:', ctx.body.options);

    this.collection.updateById(ctx.params.id, ctx.body.update)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  updateOne(ctx: Context) {
    this.$logger.info('update service called');
    this.$logger.debug('filter:', ctx.body.filter);
    this.$logger.debug('update:', ctx.body.update);
    this.$logger.debug('options:', ctx.body.options);

    this.collection.updateOne(ctx.body.filter, ctx.body.update)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  delete(ctx: Context) {
    this.$logger.info('delete service called');
    this.$logger.debug('filter:', ctx.body.filter);
    this.$logger.debug('filter:', ctx.body.options);

    let nofilter = !Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } }});

    if (nofilter)
      return ctx.next({
        message: `[${this.$get('name')}] - delete: unsecure process rejection`,
        code: RESPONSE_CODES.UNAUTHORIZED
      });

    this.collection.delete(ctx.body.filter, ctx.body.options)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  deleteById(ctx: Context) {
    this.$logger.info('deleteById service called');
    this.$logger.debug('id:', ctx.params.id);
    this.$logger.debug('filter:', ctx.body.options);

    this.collection.deleteById(ctx.params.id)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }

  @SERVICE()
  deleteOne(ctx: Context) {
    this.$logger.info('deleteOne service called');
    this.$logger.debug('filter:', ctx.body.filter);
    this.$logger.debug('filter:', ctx.body.options);

    let nofilter = !Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } }});

    if (nofilter)
      return ctx.next({
        message: `[${this.$get('name')}] - deleteOne: unsecure process rejection`,
        code: RESPONSE_CODES.UNAUTHORIZED
      });

    this.collection.deleteById(ctx.body.filter)
      .then(res => ctx.ok(res))
      .catch((error: IResponseError) => ctx.next(error));
  }
}