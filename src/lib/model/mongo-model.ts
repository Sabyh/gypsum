import * as Validall from 'validall';
import * as MongoDB from 'mongodb';
import { Model } from './model';
import { RESPONSE_CODES } from '../types';
import { SERVICE, FRIEND } from '../decorators';
import { Context } from '../context';
import { Safe } from '../misc/safe';

const safe = new Safe('mongoModel');

export class MongoModel extends Model {
  public collection: MongoDB.Collection;

  constructor() {
    super();

    this.type = 'Mongo';
  }

  @FRIEND(safe.set('MongoModel.setCollection', ['mongo']))
  protected setCollection(collection: MongoDB.Collection) {
    this.collection = collection;

    if (this.$get('indexes') && this.$get('indexes').length)
      for (let i = 0; i < this.$get('indexes').length; i++)
        if (this.$get('indexes')[i].name !== '_id')
          this.collection.createIndex(this.$get('indexes')[i].name, this.$get('indexes').options || { unique: true });

    this.onCollection();
  }

  protected onCollection() { }

  @SERVICE()
  count(ctx: Context) {
    this.$logger.info('count service called');
    this.$logger.debug('query:', ctx.query.query);
    this.$logger.debug('options:', ctx.query.options);

    ctx.query = ctx.query || { query: {}, options: {} };

    if (!ctx.query.query || Object.keys(ctx.query.query).length === 0)
      ctx.query.query = {};

    if (ctx.query.query._id)
      ctx.query.query._id = new MongoDB.ObjectID(ctx.query.query._id);

    this.collection.count(ctx.query.query || {}, <MongoDB.MongoCountPreferences>ctx.query.options)
      .then(count => {
        this.$logger.debug('count service result:', count);
        ctx.ok(count, count);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - count: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  find(ctx: Context) {
    this.$logger.info('find service called');
    this.$logger.debug('query:', ctx.query.query);
    this.$logger.debug('projections:', ctx.query.projections);
    this.$logger.debug('options:', ctx.query.options);

    ctx.query = ctx.query || { query: {}, projections: {}, options: {} };

    if (!ctx.query.query || Object.keys(ctx.query.query).length === 0)
      ctx.query.query = {};

    if (ctx.query.query._id)
      ctx.query.query._id = new MongoDB.ObjectID(ctx.query.query._id);

    let cursor: MongoDB.Cursor = this.collection.find(ctx.query.query, ctx.query.projections);

    for (let prop in ctx.query.options)
      if (prop in cursor)
        (<any>cursor)[prop](ctx.query.options[prop]);

    cursor
      .toArray()
      .then(docs => {
        this.$logger.debug('find service result:', docs);
        ctx.ok(docs);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - find: unkown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  findOne(ctx: Context) {
    this.$logger.info('findOne service called');
    this.$logger.debug('query:', ctx.query.query);
    this.$logger.debug('options:', ctx.query.options);

    ctx.query = ctx.query || { query: {}, options: {} };

    if (!ctx.query.query || Object.keys(ctx.query.query).length === 0)
      return ctx.ok(null);

    if (ctx.query.query._id)
      ctx.query.query._id = new MongoDB.ObjectID(ctx.query.query._id);

    this.collection.findOne(ctx.query.query, <MongoDB.FindOneOptions>ctx.query.options)
      .then(doc => {
        this.$logger.debug('findOne service result:', doc);
        ctx.ok(doc);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - findOne: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  findById(ctx: Context) {
    this.$logger.info('findById service called');
    this.$logger.debug('id:', ctx.params.id);
    this.$logger.debug('options:', ctx.query.options);

    if (!ctx.params.id)
      return ctx.ok(null);

    this.collection.findOne({ _id: new MongoDB.ObjectID(ctx.params.id) }, <MongoDB.FindOneOptions>ctx.query.options)
      .then(doc => {
        this.$logger.debug('findById service result:', doc);
        ctx.ok(doc);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - findById: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  insert(ctx: Context) {
    this.$logger.info('insert service called');
    this.$logger.debug('documents:', ctx.body.documents);
    this.$logger.debug('writeConcern:', ctx.body.writeConcern);

    if (!ctx.body || !ctx.body.documents)
      return ctx.ok(null);

    ctx.body.documents = Array.isArray(ctx.body.documents) ? ctx.body.documents : [ctx.body.documents];

    for (let i = 0; i < ctx.body.documents.length; i++)
      delete ctx.body.documents[i]._id;

    let schema: Validall.Schema = this.$get('schema');

    if (schema)
      if (!schema.test(ctx.body.documents))
        return ctx.next({
          message: schema.error.message,
          original: schema.error,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

    this.collection.insertMany(ctx.body.documents, <MongoDB.CollectionInsertManyOptions>ctx.body.writeConcern)
      .then(res => {
        this.$logger.debug('insert service result:');
        this.$logger.debug(JSON.stringify(res, null, 4));
        ctx.ok(ctx.body.documents.length === 1 ? res.ops[0] : res.ops);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - insert: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  search(ctx: Context) {
    this.$logger.info('search service called');
    this.$logger.debug('query:', ctx.body.query);
    this.$logger.debug('projections:', ctx.body.projections);
    this.$logger.debug('options:', ctx.body.options);

    ctx.body = ctx.body || { query: {}, projections: {}, options: {} };

    if (!ctx.body.query || Object.keys(ctx.body.query).length === 0)
      ctx.body.query = {};

    if (ctx.body.query._id)
      ctx.body.query._id = new MongoDB.ObjectID(ctx.body.query._id);

    let cursor: MongoDB.Cursor = this.collection.find(ctx.body.query, ctx.body.projections);

    for (let prop in ctx.body.options)
      if ((<any>cursor)[prop])
        (<any>cursor)[prop](ctx.body.options[prop]);

    cursor
      .toArray()
      .then(docs => {
        this.$logger.debug('search service result:', docs);
        ctx.ok(docs);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - search: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  update(ctx: Context) {
    this.$logger.info('update service called');
    this.$logger.debug('filter:', ctx.body.filter);
    this.$logger.debug('update:', ctx.body.update);
    this.$logger.debug('options:', ctx.body.options);

    ctx.body = ctx.body || { filter: {}, options: {} };

    if (!ctx.body.update || Object.keys(ctx.body.update).length === 0 || !ctx.body.filter || Object.keys(ctx.body.filter).length === 0)
      return ctx.ok(null);

    delete ctx.body.update._id;
    delete ctx.body.update.token;

    if (ctx.body.filter._id)
      ctx.body.filter._id = new MongoDB.ObjectID(ctx.body.filter._id);

    this.collection.updateMany(
      ctx.body.filter,
      ctx.body.update,
      <MongoDB.CommonOptions>(Object.assign(ctx.body.options || {}, { multi: true, upsert: false })))
      .then(res => {
        this.$logger.debug('update service result:', res);
        ctx.ok(res.result.nModified);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - update: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  updateOne(ctx: Context) {
    this.$logger.info('updateOne service called');
    this.$logger.debug('filter:', ctx.body.filter);
    this.$logger.debug('update:', ctx.body.update);
    this.$logger.debug('options:', ctx.body.options);

    ctx.body = ctx.body || { filter: {}, options: {} };

    if (!ctx.body.update || Object.keys(ctx.body.update).length === 0 || !ctx.body.filter || Object.keys(ctx.body.filter).length === 0)
      return ctx.ok(null);

    if (ctx.body.filter._id)
      ctx.body.filter._id = new MongoDB.ObjectID(ctx.body.filter._id);

    delete ctx.body.update._id;
    delete ctx.body.update.token;

    this.collection.findOneAndUpdate(
      ctx.body.filter,
      ctx.body.update,
      Object.assign(<MongoDB.FindOneAndReplaceOption>ctx.body.options || {}, { returnOriginal: false })
    ).then(res => {
      this.$logger.debug('updateOne service result:', res);
      ctx.ok(res.value);
    })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - updateOne: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  updateById(ctx: Context) {
    this.$logger.info('updateById service called');
    this.$logger.debug('id:', ctx.params.id);
    this.$logger.debug('update:', ctx.body.update);
    this.$logger.debug('options:', ctx.body.options);

    ctx.body = ctx.body || { filter: {}, options: {} };

    if (!ctx.body.update || Object.keys(ctx.body.update).length === 0 || !ctx.params.id)
      return ctx.ok(null);

    delete ctx.body.update._id;
    delete ctx.body.update.token;

    this.collection.findOneAndUpdate(
      { _id: new MongoDB.ObjectID(ctx.params.id) },
      ctx.body.update,
      Object.assign(<MongoDB.FindOneAndReplaceOption>ctx.body.options || {}, { returnOriginal: false })
    ).then(res => {
      this.$logger.debug('updateById service result:', res);
      ctx.ok(res.value);
    })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - updateById: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  delete(ctx: Context) {
    this.$logger.info('delete service called');
    this.$logger.debug('filter:', ctx.body.filter);
    this.$logger.debug('options:', ctx.body.options);

    let nofilter = !Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } } });

    if (nofilter)
      return ctx.next({
        message: `[${this.$get('name')}] - delete: unsecure process rejection`,
        code: RESPONSE_CODES.UNAUTHORIZED
      });

    this.collection.deleteMany(ctx.body.filter, <MongoDB.CommonOptions>ctx.body.options)
      .then(res => {
        this.$logger.debug('delete service result:', res);
        ctx.ok(res.result.n, res.result.n);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - delete: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  deleteOne(ctx: Context) {
    this.$logger.info('deleteOne service called');
    this.$logger.debug('id:', ctx.body.filter);
    this.$logger.debug('options:', ctx.body.options);

    if (!Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
      return ctx.next({
        message: `[${this.$get('name')}] - deleteOne: unsecure process rejection`,
        code: RESPONSE_CODES.UNAUTHORIZED
      });

    if (ctx.body.filter._id)
      ctx.body.filter._id = new MongoDB.ObjectID(ctx.body.filter._id);

    this.collection.deleteOne(ctx.body.filter, <MongoDB.CommonOptions>ctx.body.options)
      .then(res => {
        this.$logger.debug('deleteOne service result:', res);
        ctx.ok(res.result.n, res.result.n);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - deleteOne: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE()
  deleteById(ctx: Context) {
    this.$logger.info('deleteById service called');
    this.$logger.debug('id:', ctx.params.id);
    this.$logger.debug('options:', ctx.body.options);

    if (!ctx.params.id)
      return ctx.ok(null);

    this.collection.deleteOne({ _id: new MongoDB.ObjectID(ctx.params.id) }, <MongoDB.CommonOptions>ctx.body.options)
      .then(res => {
        this.$logger.debug('deleteById service result:', res);
        ctx.ok(res.result.n, res.result.n);
      })
      .catch(error => ctx.next({
        message: `[${this.$get('name')}] - deleteById: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }
}