import * as Validall from 'validall';
import * as MongoDB from 'mongodb';
import TB from 'tools-box';
import { Model } from './model';
import { RESPONSE_CODES, IResponseError, IResponse } from '../types';
import { SERVICE } from '../decorators';
import { Context } from '../context';
import { App } from '../app';
import { toObjectID } from '../util';
import { gypsumEmitter } from '../emitter';
import { State } from '../state';

export class MongoModel extends Model {
  protected collection: MongoDB.Collection;
  protected omits: string[] = [];
  protected schema: Validall.Schema = this.$get('schema');

  constructor(app: App) {
    super(app);

    this.type = 'Mongo';

    let schema = this.$get('schema');

    if (this.schema) {
      let omits = this.schema.getPropsByName('omit');
      this.omits = omits.filter((item: any) => item.value === false).map((item: any) => item.path);
    }

    let dbName = this.app.$get('database_name');
    gypsumEmitter.on(`${dbName} ready`, (db: MongoDB.Db) => {
      this.collection = db.collection(this.name);

      if (this.$get('indexes') && this.$get('indexes').length)
        for (let i = 0; i < this.$get('indexes').length; i++)
          if (this.$get('indexes')[i].name !== '_id')
            this.collection.createIndex(this.$get('indexes')[i].name, this.$get('indexes').options || { unique: true });

      this.onCollection();
    });
  }

  protected onCollection() { }

  @SERVICE({
    args: ['query.query', 'query.options']
  })
  count(query: any = {}, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('count service called');

    query = toObjectID(query);

    return new Promise((resolve, reject) => {

      this.collection.count(query || {}, <MongoDB.MongoCountPreferences>options)
        .then(count => {
          this.$logger.debug('count service resolving result');
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
    args: ['query.query', 'query.options']
  })
  find(query: any = {}, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('find service called');

    query = toObjectID(query);

    return new Promise((resolve, reject) => {

      let cursor: MongoDB.Cursor = this.collection.find(query);

      for (let prop in options)
        if (prop in cursor)
          (<any>cursor)[prop](options[prop]);

      cursor
        .toArray()
        .then(docs => {
          this.$logger.debug('find service resolving result');

          if (this.omits && this.omits.length)
            for (let i = 0; i < docs.length; i++)
              TB.omit(docs[i], this.omits);

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

    return new Promise((resolve, reject) => {

      if (!query || Object.keys(query).length === 0)
        return resolve({ data: null });

      query = toObjectID(query);

      this.collection.findOne(query, <MongoDB.FindOneOptions>options)
        .then(doc => {
          this.$logger.debug('findOne service resolving result');

          if (this.omits && this.omits.length)
            TB.omit(doc, this.omits);

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
    this.$logger.debug('options:', !!options);

    return new Promise((resolve, reject) => {

      if (!id)
        return resolve({ data: null });

      this.collection.findOne({ _id: new MongoDB.ObjectID(id) }, <MongoDB.FindOneOptions>options)
        .then(doc => {
          this.$logger.debug('findById service resolving result');

          if (this.omits && this.omits.length)
            TB.omit(doc, this.omits);

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

    return new Promise((resolve, reject) => {

      if (!documents)
        return resolve({ data: null });

      documents = Array.isArray(documents) ? documents : [documents];

      for (let i = 0; i < documents.length; i++) {
        let document = documents[i];
        document.createdAt = Date.now();
        document.updatedAt = Date.now();

        if (State.currentContext) {
          document.createdBy = State.currentContext.user._id.toString();
          document.updatedBy = State.currentContext.user._id.toString();
        }

        if (this.schema) {
          if (!this.schema.test(document))
            return reject({
              message: this.schema.error.message,
              original: this.schema.error,
              code: RESPONSE_CODES.UNAUTHORIZED
            });

          let props = this.schema.getProps();
          let internals = [];

          for (let prop in props)
            if (props[prop].internal)
              internals.push(prop);

          if (internals.length) {
            for (let i = 0; i < internals.length; i++)
              if (this.schema.defaults[internals[i]] !== undefined) {
                if (TB.getValue(document, internals[i]) !== this.schema.defaults[internals[i]])
                  return reject({
                    message: `[${this.name}]: '${internals[i]}' cannot be set externaly!`,
                    code: RESPONSE_CODES.UNAUTHORIZED
                  });
              } else if (TB.getValue(document, internals[i]) !== undefined) {
                return reject({
                  message: `[${this.name}]: '${internals[i]}' cannot be set externaly!`,
                  code: RESPONSE_CODES.UNAUTHORIZED
                });
              }
          }
        }
      }

      this.collection.insertMany(documents, <MongoDB.CollectionInsertManyOptions>writeConcern)
        .then(res => {
          this.$logger.debug('insert service resolving result');

          let insertedDocs = res.ops;

          if (this.omits && this.omits.length)
            for (let i = 0; i < insertedDocs.length; i++)
              TB.omit(insertedDocs[i], this.omits);

          resolve({ data: insertedDocs });
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
    this.$logger.info('insert one service called');
    
    return new Promise((resolve, reject) => {
      if (!document)
        resolve({ data: null });

      document.createdAt = Date.now();
      document.updatedAt = Date.now();

      if (State.currentContext) {
        document.createdBy = State.currentContext.user._id.toString();
        document.updatedBy = State.currentContext.user._id.toString();
      }

      if (this.schema) {
        if (!this.schema.test(document))
          return reject({
            message: this.schema.error.message,
            original: this.schema.error,
            code: RESPONSE_CODES.UNAUTHORIZED
          });
      }

      this.collection.insertOne(document)
        .then((res) => {
          this.$logger.debug('insert one service resolving result');
          resolve({ data: res.ops[0] });
        })
        .catch(err => reject(err));
    });
  }

  @SERVICE({
    args: ['body.query', 'body.options']
  })
  search(query: any = {}, options: any = {}, ctx?: Context): Promise<IResponse> {
    this.$logger.info('search service called');

    query = toObjectID(query);

    return new Promise((resolve, reject) => {

      let cursor: MongoDB.Cursor = this.collection.find(query);

      for (let prop in options)
        if ((<any>cursor)[prop])
          (<any>cursor)[prop](options[prop]);

      cursor
        .toArray()
        .then(docs => {
          this.$logger.debug('search service resolving result');

          if (this.omits && this.omits.length)
            for (let i = 0; i < docs.length; i++)
              TB.omit(docs[i], this.omits);

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
    args: ['body.filter', 'body.update']
  })
  update(filter: any, update: any, ctx?: Context): Promise<IResponse> {
    this.$logger.info('update service called');

    filter = filter || {};

    return new Promise((resolve, reject) => {

      if (!update || Object.keys(update).length === 0)
        return resolve({ data: null });

      delete update._id;

      if (update.$set) {
        delete update.$set._id;
        update.$set.updatedAt = Date.now();

      } else {
        update.$set = { updatedAt: Date.now() };
      }

      if (State.currentContext)
        update.$set.updatedBy = State.currentContext.user._id.toString();

      filter = toObjectID(filter);

      this.collection.find(filter).project({ _id: 1 }).toArray()
        .then(ids => {
          ids = ids.map(entry => entry._id);
          
          this.collection.updateMany(
            { _id: { $in: ids } },
            update,
            { upsert: false }
          )
            .then(res => {
              this.$logger.debug('update service resolving result');
              this.find({ _id: { $in: ids } })
                .then(res => resolve(res));
            })
            .catch(error => reject({
              message: `[${this.name}] - update: unknown error`,
              original: error,
              code: RESPONSE_CODES.UNKNOWN_ERROR
            }));
        })
        .catch(error => reject({
          message: `[${this.name}] - update: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['body.filter', 'body.update']
  })
  updateOne(filter: any, update: any, ctx?: Context): Promise<IResponse> {
    this.$logger.info('updateOne service called');

    filter = filter || {};

    return new Promise((resolve, reject) => {

      if (!update || Object.keys(update).length === 0)
        return resolve({ data: null });

      if (filter._id && typeof filter._id === 'string')
        filter._id = toObjectID(filter);

      delete update._id;

      if (update.$set) {
        delete update.$set._id;
        update.$set.updatedAt = Date.now();
      } else {
        update.$set = { updatedAt: Date.now() };
      }

      if (State.currentContext)
        update.$set.updatedBy = State.currentContext.user._id.toString();

      // if no schema just do find and update
      if (!this.schema) {
        this.collection.findOneAndUpdate(
          filter,
          update,
          { returnOriginal: false }
        ).then(res => {
          this.$logger.debug('updateOne service resolving result');
          resolve({ data: res.value });
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



            // update the doc in database
            this.collection.findOneAndUpdate(
              { _id: docId },
              update,
              { returnOriginal: false }
            ).then(res => {
              updatedDoc = res.value;


              // test the updated doc in the database
              let state = this.schema.test(updatedDoc);

              if (state) {
                // if test pass confim that the constants and the internal fields are not changed
                let props = this.schema.getProps();
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
                    let changedField = TB.compareValues(constants, preUpdatedDoc, updatedDoc);
                    if (changedField)
                      errObj = {
                        message: `[${this.name}]: '${changedField}' is a constant field that cannot be changed!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      }
                  }

                  if (ctx) {
                    if (!errObj && internals.length) {
                      let changedField = TB.compareValues(internals, preUpdatedDoc, updatedDoc);
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
                  message: this.schema.error.message,
                  original: this.schema.error,
                  code: RESPONSE_CODES.BAD_REQUEST
                };
              }

              if (errObj) {
                // if error exists replace the updated document with pre updated one and send the error
                this.collection.replaceOne({ _id: docId }, preUpdatedDoc)
                  .then(res => reject(errObj))
                  .catch(error => reject({
                    message: 'error reverting document after update',
                    original: { message: this.schema.error.message, error: error },
                    code: RESPONSE_CODES.UNKNOWN_ERROR
                  }));
              } else {
                // if test pass send the updated document
                this.$logger.debug('updateOne service resolving result');

                if (this.omits && this.omits.length)
                  TB.omit(updatedDoc, this.omits);

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
    args: ['params.id', 'body.update']
  })
  updateById(id: string, update: any, ctx?: Context): Promise<IResponse> {
    this.$logger.info('updateById service called');

    return new Promise((resolve, reject) => {

      if (!update || Object.keys(update).length === 0 || !id)
        return resolve({ data: null });

      delete update._id;

      if (update.$set) {
        delete update.$set._id;
        update.$set.updatedAt = Date.now();
      } else {
        update.$set = { updatedAt: Date.now() };
      }

      if (State.currentContext)
        update.$set.updatedBy = State.currentContext.user._id.toString();

      if (!this.schema) {
        this.collection.findOneAndUpdate(
          { _id: new MongoDB.ObjectID(id) },
          update,
          { returnOriginal: false }
        ).then(res => {
          this.$logger.debug('updateById service resolving result');
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

            // update the doc in database
            this.collection.findOneAndUpdate(
              { _id: new MongoDB.ObjectID(id) },
              update,
              { returnOriginal: false }
            ).then(res => {
              updatedDoc = res.value;

              // test the updated doc in the database
              let state = this.schema.test(updatedDoc);

              if (state) {
                // if test pass confim that the constants and the internal fields are not changed
                let props = this.schema.getProps();
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
                    let changedField = TB.compareValues(constants, preUpdatedDoc, updatedDoc);
                    if (changedField)
                      errObj = {
                        message: `[${this.name}]: '${changedField}' is a constant field that cannot be changed!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      }
                  }

                  if (ctx) {
                    if (!errObj && internals.length) {
                      let changedField = TB.compareValues(internals, preUpdatedDoc, updatedDoc);
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
                  message: this.schema.error.message,
                  original: this.schema.error,
                  code: RESPONSE_CODES.BAD_REQUEST
                };
              }

              if (errObj) {
                // if error exists replace the updated document with pre updated one and send the error
                this.collection.replaceOne({ _id: new MongoDB.ObjectID(id) }, preUpdatedDoc)
                  .then(res => reject(errObj))
                  .catch(error => reject({
                    message: 'error reverting document after update',
                    original: { message: this.schema.error.message, error: error },
                    code: RESPONSE_CODES.UNKNOWN_ERROR
                  }));
              } else {
                // if test pass send the updated document
                this.$logger.debug('updateById service resolving result');

                if (this.omits && this.omits.length)
                  TB.omit(updatedDoc, this.omits);

                resolve({ data: updatedDoc });
              }

            })
              .catch(error => reject({
                message: `[${this.name}] - updateById: unknown error`,
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
    args: ['body.filter']
  })
  delete(filter: any, ctx?: Context): Promise<IResponse> {
    this.$logger.info('delete service called');

    return new Promise((resolve, reject) => {

      if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
        return reject({
          message: `[${this.name}] - delete: unsecure process rejection`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      this.collection.deleteMany(filter)
        .then(res => {
          this.$logger.debug('delete service resolving result');
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
    args: ['body.filter']
  })
  deleteOne(filter: any, ctx?: Context): Promise<IResponse> {
    this.$logger.info('deleteOne service called');

    return new Promise((resolve, reject) => {

      if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
        return reject({
          message: `[${this.name}] - deleteOne: unsecure process rejection`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      if (filter._id)
        filter._id = new MongoDB.ObjectID(filter._id);

      this.collection.findOneAndDelete(filter)
        .then(res => {
          this.$logger.debug('deleteOne service resolving result');

          let deletedDoc = res.value;

          if (this.omits && this.omits.length)
            TB.omit(deletedDoc, this.omits);

          resolve({ data: deletedDoc });
        })
        .catch(error => reject({
          message: `[${this.name}] - deleteOne: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    args: ['params.id']
  })
  deleteById(id: string, ctx?: Context): Promise<IResponse> {
    this.$logger.info('deleteById service called');

    return new Promise((resolve, reject) => {

      if (!id)
        return resolve({ data: null });

      this.collection.findOneAndDelete({ _id: new MongoDB.ObjectID(id) })
        .then(res => {
          this.$logger.debug('deleteById service resolving result');

          let deletedDoc = res.value;

          if (this.omits && this.omits.length)
            TB.omit(deletedDoc, this.omits);

          resolve({ data: deletedDoc });
        })
        .catch(error => reject({
          message: `[${this.name}] - deleteById: unknown error`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }
}