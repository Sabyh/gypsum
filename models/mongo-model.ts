import * as Validall from 'validall';
import * as MongoDB from 'mongodb';
import { Model } from './model';
import { RESPONSE_CODES, ResponseError, IResponseError, Response, IResponse } from '../types';
import { SERVICE, FRIEND } from '../decorators';
import { Context } from '../context';
import { Safe } from '../misc/safe';
import { objectUtil } from '../util';

const safe = new Safe('mongoModel');

export class MongoModel extends Model {
  protected collection: MongoDB.Collection;

  constructor(appName: string) {
    super(appName);

    this.type = 'Mongo';
  }

  $setCollection(collection: MongoDB.Collection) {
    this.collection = collection;

    if (this.$get('indexes') && this.$get('indexes').length)
      for (let i = 0; i < this.$get('indexes').length; i++)
        if (this.$get('indexes')[i].name !== '_id')
          this.collection.createIndex(this.$get('indexes')[i].name, this.$get('indexes').options || { unique: true });

    this.onCollection();
  }

  protected onCollection() { }

  @SERVICE({
    args: ['query.query', 'query.options']
  })
  count(query: any = {}, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('count service called');
    this.$logger.debug('query:', query);
    this.$logger.debug('options:', options);

    if (query._id)
      query._id = new MongoDB.ObjectID(query._id);

    return new Promise((resolve, reject) => {

      this.collection.count(query || {}, <MongoDB.MongoCountPreferences>options)
        .then(count => {
          this.$logger.debug('count service result:', count);
          resolve({ data: count, count: count });
        })
        .catch(error => reject({
          message: `[${this.name}] - count: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));

    });

  }

  @SERVICE({
    args: ['query.query', 'query.projections', 'query.options']
  })
  find(query: any = {}, projections: any = {}, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('find service called');
    this.$logger.debug('query:', query);
    this.$logger.debug('projections:', projections);
    this.$logger.debug('options:', options);

    if (query._id)
      query._id = new MongoDB.ObjectID(query._id);

    return new Promise((resolve, reject) => {

      let cursor: MongoDB.Cursor = this.collection.find(query, projections);

      for (let prop in options)
        if (prop in cursor)
          (<any>cursor)[prop](options[prop]);

      cursor
        .toArray()
        .then(docs => {
          this.$logger.debug('find service result:', docs);

          let schema = this.$get('schema');

          if (!schema)
            return resolve({ data: docs });

          let selects = schema.getPropsByName('select');
          selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

          if (selects && selects.length)
            for (let i = 0; i < docs.length; i++)
              objectUtil.omit(docs[i], selects);

          resolve({ data: docs });
        })
        .catch(error => reject({
          message: `[${this.name}] - find: unkown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['query.query', 'query.options']
  })
  findOne(query: any, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('findOne service called');
    this.$logger.debug('query:', query);
    this.$logger.debug('options:', options);

    return new Promise((resolve, reject) => {

      if (!query || Object.keys(query).length === 0)
        return resolve({ data: null });

      if (query._id)
        query._id = new MongoDB.ObjectID(query._id);

      this.collection.findOne(query, <MongoDB.FindOneOptions>options)
        .then(doc => {
          this.$logger.debug('findOne service result:', doc);

          let schema = this.$get('schema');

          if (!schema)
            return resolve({ data: doc });

          let selects = schema.getPropsByName('select');
          selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

          if (selects && selects.length)
            objectUtil.omit(doc, selects);

          resolve({ data: doc });
        })
        .catch(error => reject({
          message: `[${this.name}] - findOne: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });

  }

  @SERVICE({
    args: ['params.id', 'query.options']
  })
  findById(id: string, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('findById service called');
    this.$logger.debug('id:', id);
    this.$logger.debug('options:', options);

    return new Promise((resolve, reject) => {

      if (!id)
        return resolve({ data: null });

      this.collection.findOne({ _id: new MongoDB.ObjectID(id) }, <MongoDB.FindOneOptions>options)
        .then(doc => {
          this.$logger.debug('findById service result:', doc);

          let schema = this.$get('schema');

          if (!schema)
            return resolve({ data: doc });

          let selects = schema.getPropsByName('select');
          selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

          if (selects && selects.length)
            objectUtil.omit(doc, selects);

          resolve({ data: doc });
        })
        .catch(error => reject({
          message: `[${this.name}] - findById: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['body.documents', 'body.writeConcern']
  })
  insert(documents: any, writeConcern: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('insert service called');
    this.$logger.debug('documents:')
    this.$logger.debug(documents);
    this.$logger.debug('writeConcern:', writeConcern);

    return new Promise((resolve, reject) => {

      if (!documents)
        return resolve({ data: null });

      documents = Array.isArray(documents) ? documents : [documents];

      let schema: Validall.Schema = this.$get('schema');

      for (let i = 0; i < documents.length; i++) {
        let document = documents[i];
        delete document._id;

        if (schema) {
          if (!schema.test(document))
            return reject({
              message: schema.error.message,
              original: schema.error,
              code: RESPONSE_CODES.UNAUTHORIZED
            });

          let props = schema.getProps();
          let internals = [];

          for (let prop in props)
            if (props[prop].internal)
              internals.push(prop);

          if (internals.length) {
            for (let i = 0; i < internals.length; i++)
              if (schema.defaults[internals[i]] !== undefined)
                if (objectUtil.getValue(document, internals[i]) !== schema.defaults[internals[i]])
                  return reject({
                    message: `[${this.name}]: '${internals[i]}' cannot be set externaly!`,
                    code: RESPONSE_CODES.UNAUTHORIZED
                  });
                else if (objectUtil.getValue(document, internals[i]) !== undefined)
                  return reject({
                    message: `[${this.name}]: '${internals[i]}' cannot be set externaly!`,
                    code: RESPONSE_CODES.UNAUTHORIZED
                  });
          }
        }
      }

      this.collection.insertMany(documents, <MongoDB.CollectionInsertManyOptions>writeConcern)
        .then(res => {
          this.$logger.debug('insert service result:');
          this.$logger.debug(JSON.stringify(res, null, 4));

          let schema = this.$get('schema');

          if (!schema)
            return resolve({ data: res.ops });

          let selects = schema.getPropsByName('select');
          selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

          if (selects && selects.length)
            for (let i = 0; i < res.ops.length; i++)
              objectUtil.omit(res.ops[i], selects);

          resolve({ data: res.ops });
        })
        .catch(error => reject({
          message: `[${this.name}] - insert: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['body.document']
  })
  insertOne(document: any, ctx?: Context): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      let schema: Validall.Schema = this.$get('schema');

      if (schema) {
        if (!schema.test(document))
          return reject({
            message: schema.error.message,
            original: schema.error,
            code: RESPONSE_CODES.UNAUTHORIZED
          });
      }

      this.collection.insertOne(document)
        .then((res) => {
          resolve({ data: res.ops[0] });
        })
        .catch(err => reject(err));
    });
  }

  @SERVICE({
    args: ['body.query', 'body.projections', 'body.options']
  })
  search(query: any = {}, projections: any = {}, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('search service called');
    this.$logger.debug('query:', query);
    this.$logger.debug('projections:', projections);
    this.$logger.debug('options:', options);

    if (query._id)
      query._id = new MongoDB.ObjectID(query._id);

    return new Promise((resolve, reject) => {

      let cursor: MongoDB.Cursor = this.collection.find(query, projections);

      for (let prop in options)
        if ((<any>cursor)[prop])
          (<any>cursor)[prop](options[prop]);

      cursor
        .toArray()
        .then(docs => {
          this.$logger.debug('search service result:', docs);
          let schema = this.$get('schema');

          if (!schema)
            return resolve({ data: docs });

          let selects = schema.getPropsByName('select');
          selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

          if (selects && selects.length)
            for (let i = 0; i < docs.length; i++)
              objectUtil.omit(docs[i], selects);

          resolve({ data: docs });
        })
        .catch(error => reject({
          message: `[${this.name}] - search: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.update', 'body.options']
  })
  update(filter: any, update: any, options = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('update service called');
    this.$logger.debug('filter:', filter);
    this.$logger.debug('update:', update);
    this.$logger.debug('options:', options);

    filter = filter || {};

    return new Promise((resolve, reject) => {

      if (!update || Object.keys(update).length === 0)
        return resolve({ data: null });

      delete update._id;
      delete update.token;

      if (filter._id)
        filter._id = new MongoDB.ObjectID(filter._id);

      this.collection.updateMany(
        filter,
        update,
        <MongoDB.CommonOptions>(Object.assign(options || {}, { multi: true, upsert: false })))
        .then(res => {
          this.$logger.debug('update service result:', res);
          resolve({ data: res.result.nModified, count: res.result.nModified });
        })
        .catch(error => reject({
          message: `[${this.name}] - update: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.update', 'body.options']
  })
  updateOne(filter: any, update: any, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('updateOne service called');
    this.$logger.debug('filter:', filter);
    this.$logger.debug('update:', update);
    this.$logger.debug('options:', options);

    filter = filter || {};

    return new Promise((resolve, reject) => {

      if (!update || Object.keys(update).length === 0)
        return resolve({ data: null });

      if (filter._id)
        filter._id = new MongoDB.ObjectID(filter._id);

      delete update._id;
      delete update.token;

      let schema: Validall.Schema = this.$get('schema');

      // if no schema just do find and update
      if (!schema) {
        this.collection.findOneAndUpdate(
          filter,
          update,
          Object.assign(<MongoDB.FindOneAndReplaceOption>options || {}, { returnOriginal: false })
        ).then(res => {
          this.$logger.debug('updateOne service result:', res);
          resolve(res.value);
        })
          .catch(error => reject({
            message: `[${this.name}] - updateOne: unknown error`,
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));

      } else {
        // if there is a schema get the current doc
        this.collection.findOne(filter)
          .then(doc => {
            if (!doc)
              return resolve({ data: null });

            let preUpdatedDoc: any = doc;
            let docId = preUpdatedDoc._id;
            let updatedDoc: any;
            let errObj: IResponseError;

            delete preUpdatedDoc._id;

            // update the doc in database
            this.collection.findOneAndUpdate(
              filter,
              update,
              Object.assign(<MongoDB.FindOneAndReplaceOption>options || {}, { returnOriginal: false })
            ).then(res => {
              updatedDoc = res.value;
              delete updatedDoc._id;

              // test the updated doc in the database
              let state = schema.test(updatedDoc);

              if (state) {
                // if test pass confim that the constants and the internal fields are not changed
                let props = schema.getProps();
                if (Object.keys(props).length) {
                  let constants: string[] = [], internals: string[] = [];

                  for (let prop in props) {
                    if (props[prop].constant)
                      constants.push(prop);
                    else if (props[prop].internal) {
                      internals.push(prop);
                    }
                  }

                  if (constants.length) {
                    let changedField = objectUtil.compareValues(constants, preUpdatedDoc, updatedDoc);
                    if (changedField)
                      errObj = {
                        message: `[${this.name}]: '${changedField}' is a constant field that cannot be changed!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      }
                  }

                  if (ctx) {
                    if (!errObj && internals.length) {
                      let changedField = objectUtil.compareValues(internals, preUpdatedDoc, updatedDoc);
                      if (changedField)
                        errObj = {
                          message: `[${this.name}]: '${changedField}' cannot be modified externaly!`,
                          code: RESPONSE_CODES.UNAUTHORIZED
                        }
                    }
                  }
                }

              } else {
                errObj = {
                  message: schema.error.message,
                  original: schema.error,
                  code: RESPONSE_CODES.BAD_REQUEST
                };
              }

              if (errObj) {
                // if error exists replace the updated document with pre updated one and send the error
                this.collection.replaceOne({ _id: docId }, preUpdatedDoc)
                  .then(res => reject(errObj))
                  .catch(error => reject({
                    message: 'error reverting document after update',
                    original: { message: schema.error.message, error: error },
                    code: RESPONSE_CODES.UNKNOWN_ERROR
                  }));
              } else {
                // if test pass send the updated document
                this.$logger.debug('updateOne service result:', updatedDoc);

                let selects = schema.getPropsByName('select');
                selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

                if (selects && selects.length)
                  objectUtil.omit(updatedDoc, selects);

                resolve({ data: updatedDoc });
              }

            })
              .catch(error => reject({
                message: `[${this.name}] - updateOne: unknown error`,
                original: error,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              }));
          })
          .catch(error => reject({
            message: `[${this.name}] - findOne: unknown error`,
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      }
    });

  }

  @SERVICE({
    args: ['params.id', 'body.update', 'body.options']
  })
  updateById(id: string, update: any, options: any = {}, ctx?: Context): Promise<IResponse> {

    this.$logger.info('updateById service called');
    this.$logger.debug('id:', id);
    this.$logger.debug('update:', update);
    this.$logger.debug('options:', options);

    return new Promise((resolve, reject) => {

      if (!update || Object.keys(update).length === 0 || !id)
        return resolve({ data: null });

      delete update._id;
      delete update.token;

      let schema: Validall.Schema = this.$get('schema');

      if (!schema) {
        this.collection.findOneAndUpdate(
          { _id: new MongoDB.ObjectID(id) },
          update,
          Object.assign(<MongoDB.FindOneAndReplaceOption>options || {}, { returnOriginal: false })
        ).then(res => {
          this.$logger.debug('updateById service result:', res);
          resolve(res.value);
        })
          .catch(error => reject({
            message: `[${this.name}] - updateById: unknown error`,
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));

      } else {
        // if there is a schema get the current doc
        this.collection.findOne({ _id: new MongoDB.ObjectID(id) })
          .then(doc => {
            if (!doc)
              return resolve({ data: null });

            let preUpdatedDoc: any = doc;
            let updatedDoc: any;
            let errObj: IResponseError;

            delete preUpdatedDoc._id;

            // update the doc in database
            this.collection.findOneAndUpdate(
              { _id: new MongoDB.ObjectID(id) },
              update,
              Object.assign(<MongoDB.FindOneAndReplaceOption>options || {}, { returnOriginal: false })
            ).then(res => {
              updatedDoc = res.value;
              delete updatedDoc._id;

              // test the updated doc in the database
              let state = schema.test(updatedDoc);

              if (state) {
                // if test pass confim that the constants and the internal fields are not changed
                let props = schema.getProps();
                if (Object.keys(props).length) {
                  let constants: string[] = [], internals: string[] = [];

                  for (let prop in props) {
                    if (props[prop].constant)
                      constants.push(prop);
                    else if (props[prop].internal) {
                      internals.push(prop);
                    }
                  }

                  if (constants.length) {
                    let changedField = objectUtil.compareValues(constants, preUpdatedDoc, updatedDoc);
                    if (changedField)
                      errObj = {
                        message: `[${this.name}]: '${changedField}' is a constant field that cannot be changed!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      }
                  }

                  if (ctx) {
                    if (!errObj && internals.length) {
                      let changedField = objectUtil.compareValues(internals, preUpdatedDoc, updatedDoc);
                      if (changedField)
                        errObj = {
                          message: `[${this.name}]: '${changedField}' cannot be modified externaly!`,
                          code: RESPONSE_CODES.UNAUTHORIZED
                        }
                    }
                  }
                }

              } else {
                errObj = {
                  message: schema.error.message,
                  original: schema.error,
                  code: RESPONSE_CODES.BAD_REQUEST
                };
              }

              if (errObj) {
                // if error exists replace the updated document with pre updated one and send the error
                this.collection.replaceOne({ _id: new MongoDB.ObjectID(id) }, preUpdatedDoc)
                  .then(res => reject(errObj))
                  .catch(error => reject({
                    message: 'error reverting document after update',
                    original: { message: schema.error.message, error: error },
                    code: RESPONSE_CODES.UNKNOWN_ERROR
                  }));
              } else {
                // if test pass send the updated document
                this.$logger.debug('updateOne service result:', updatedDoc);
                let selects = schema.getPropsByName('select');
                selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

                if (selects && selects.length)
                  objectUtil.omit(updatedDoc, selects);

                resolve({ data: updatedDoc });
              }

            })
              .catch(error => reject({
                message: `[${this.name}] - updateOne: unknown error`,
                original: error,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              }));
          })
          .catch(error => reject({
            message: `[${this.name}] - findOne: unknown error`,
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      }
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.options']
  })
  delete(filter: any, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('delete service called');
    this.$logger.debug('filter:', filter);
    this.$logger.debug('options:', options);

    return new Promise((resolve, reject) => {

      if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
        return reject({
          message: `[${this.name}] - delete: unsecure process rejection`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      this.collection.deleteMany(filter, <MongoDB.CommonOptions>options)
        .then(res => {
          this.$logger.debug('delete service result:', res);
          resolve({ data: res.result.n, count: res.result.n });
        })
        .catch(error => reject({
          message: `[${this.name}] - delete: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.options']
  })
  deleteOne(filter: any, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('deleteOne service called');
    this.$logger.debug('id:', filter);
    this.$logger.debug('options:', options);

    return new Promise((resolve, reject) => {

      if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
        return reject({
          message: `[${this.name}] - deleteOne: unsecure process rejection`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      if (filter._id)
        filter._id = new MongoDB.ObjectID(filter._id);

      this.collection.findOneAndDelete(filter, <MongoDB.CommonOptions>options)
        .then(res => {
          this.$logger.debug('deleteOne service result:', res);
          resolve({ data: res.value });
        })
        .catch(error => reject({
          message: `[${this.name}] - deleteOne: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['params.id', 'body.options']
  })
  deleteById(id: string, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('deleteById service called');
    this.$logger.debug('id:', id);
    this.$logger.debug('options:', options);

    return new Promise((resolve, reject) => {

      if (!id)
        return resolve({ data: null });

      this.collection.findOneAndDelete({ _id: new MongoDB.ObjectID(id) }, <MongoDB.CommonOptions>options)
        .then(res => {
          this.$logger.debug('deleteById service result:', res);
          resolve({ data: res.value });
        })
        .catch(error => reject({
          message: `[${this.name}] - deleteById: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }
}