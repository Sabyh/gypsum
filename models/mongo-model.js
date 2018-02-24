"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validall = require("validall");
const MongoDB = require("mongodb");
const model_1 = require("./model");
const types_1 = require("../types");
const decorators_1 = require("../decorators");
const safe_1 = require("../misc/safe");
const util_1 = require("../util");
const safe = new safe_1.Safe('mongoModel');
class MongoModel extends model_1.Model {
    constructor() {
        super();
        this.type = 'Mongo';
    }
    setCollection(collection) {
        this.collection = collection;
        if (this.$get('indexes') && this.$get('indexes').length)
            for (let i = 0; i < this.$get('indexes').length; i++)
                if (this.$get('indexes')[i].name !== '_id')
                    this.collection.createIndex(this.$get('indexes')[i].name, this.$get('indexes').options || { unique: true });
        this.onCollection();
    }
    onCollection() { }
    count(query = {}, options = {}) {
        this.$logger.info('count service called');
        this.$logger.debug('query:', query);
        this.$logger.debug('options:', options);
        if (query._id)
            query._id = new MongoDB.ObjectID(query._id);
        return new Promise((resolve, reject) => {
            this.collection.count(query || {}, options)
                .then(count => {
                this.$logger.debug('count service result:', count);
                resolve({ data: count, count: count });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - count: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    find(query = {}, projections = {}, options = {}) {
        this.$logger.info('find service called');
        this.$logger.debug('query:', query);
        this.$logger.debug('projections:', projections);
        this.$logger.debug('options:', options);
        if (query._id)
            query._id = new MongoDB.ObjectID(query._id);
        return new Promise((resolve, reject) => {
            let cursor = this.collection.find(query, projections);
            for (let prop in options)
                if (prop in cursor)
                    cursor[prop](options[prop]);
            cursor
                .toArray()
                .then(docs => {
                this.$logger.debug('find service result:', docs);
                let schema = this.$get('schema');
                if (!schema)
                    return resolve({ data: docs });
                let selects = schema.getPropsByName('select');
                selects = selects.filter((item) => item.value === false).map((item) => item.path);
                if (selects && selects.length)
                    for (let i = 0; i < docs.length; i++)
                        util_1.objectUtil.omit(docs[i], selects);
                resolve({ data: docs });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - find: unkown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    findOne(query, options = {}) {
        this.$logger.info('findOne service called');
        this.$logger.debug('query:', query);
        this.$logger.debug('options:', options);
        return new Promise((resolve, reject) => {
            if (!query || Object.keys(query).length === 0)
                return resolve({ data: null });
            if (query._id)
                query._id = new MongoDB.ObjectID(query._id);
            this.collection.findOne(query, options)
                .then(doc => {
                this.$logger.debug('findOne service result:', doc);
                let schema = this.$get('schema');
                if (!schema)
                    return resolve({ data: doc });
                let selects = schema.getPropsByName('select');
                selects = selects.filter((item) => item.value === false).map((item) => item.path);
                if (selects && selects.length)
                    util_1.objectUtil.omit(doc, selects);
                resolve({ data: doc });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - findOne: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    findById(id, options = {}) {
        this.$logger.info('findById service called');
        this.$logger.debug('id:', id);
        this.$logger.debug('options:', options);
        return new Promise((resolve, reject) => {
            if (!id)
                return resolve({ data: null });
            this.collection.findOne({ _id: new MongoDB.ObjectID(id) }, options)
                .then(doc => {
                this.$logger.debug('findById service result:', doc);
                let schema = this.$get('schema');
                if (!schema)
                    return resolve({ data: doc });
                let selects = schema.getPropsByName('select');
                selects = selects.filter((item) => item.value === false).map((item) => item.path);
                if (selects && selects.length)
                    util_1.objectUtil.omit(doc, selects);
                resolve({ data: doc });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - findById: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    insert(documents, writeConcern = {}) {
        this.$logger.info('insert service called');
        this.$logger.debug('documents:', documents);
        this.$logger.debug('writeConcern:', writeConcern);
        return new Promise((resolve, reject) => {
            if (!documents)
                return resolve({ data: null });
            documents = Array.isArray(documents) ? documents : [documents];
            let schema = this.$get('schema');
            for (let i = 0; i < documents.length; i++) {
                let document = documents[i];
                delete document._id;
                if (schema) {
                    if (!schema.test(document))
                        return reject({
                            message: schema.error.message,
                            original: schema.error,
                            code: types_1.RESPONSE_CODES.UNAUTHORIZED
                        });
                    let props = schema.getProps();
                    let internals = [];
                    for (let prop in props)
                        if (props[prop].internal)
                            internals.push(prop);
                    if (internals.length) {
                        for (let i = 0; i < internals.length; i++)
                            if (schema.defaults[internals[i]] !== undefined)
                                if (util_1.objectUtil.getValue(document, internals[i]) !== schema.defaults[internals[i]])
                                    return reject({
                                        message: `[${this.$get('name')}]: '${internals[i]}' cannot be set externaly!`,
                                        code: types_1.RESPONSE_CODES.UNAUTHORIZED
                                    });
                                else if (util_1.objectUtil.getValue(document, internals[i]) !== undefined)
                                    return reject({
                                        message: `[${this.$get('name')}]: '${internals[i]}' cannot be set externaly!`,
                                        code: types_1.RESPONSE_CODES.UNAUTHORIZED
                                    });
                    }
                }
            }
            this.collection.insertMany(documents, writeConcern)
                .then(res => {
                this.$logger.debug('insert service result:');
                this.$logger.debug(JSON.stringify(res, null, 4));
                let schema = this.$get('schema');
                if (!schema)
                    return resolve({ data: documents.length === 1 ? res.ops[0] : res.ops });
                let selects = schema.getPropsByName('select');
                selects = selects.filter((item) => item.value === false).map((item) => item.path);
                if (selects && selects.length)
                    for (let i = 0; i < res.ops.length; i++)
                        util_1.objectUtil.omit(res.ops[i], selects);
                resolve({ data: documents.length === 1 ? res.ops[0] : res.ops });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - insert: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    search(query = {}, projections = {}, options = {}) {
        this.$logger.info('search service called');
        this.$logger.debug('query:', query);
        this.$logger.debug('projections:', projections);
        this.$logger.debug('options:', options);
        if (query._id)
            query._id = new MongoDB.ObjectID(query._id);
        return new Promise((resolve, reject) => {
            let cursor = this.collection.find(query, projections);
            for (let prop in options)
                if (cursor[prop])
                    cursor[prop](options[prop]);
            cursor
                .toArray()
                .then(docs => {
                this.$logger.debug('search service result:', docs);
                let schema = this.$get('schema');
                if (!schema)
                    return resolve({ data: docs });
                let selects = schema.getPropsByName('select');
                selects = selects.filter((item) => item.value === false).map((item) => item.path);
                if (selects && selects.length)
                    for (let i = 0; i < docs.length; i++)
                        util_1.objectUtil.omit(docs[i], selects);
                resolve({ data: docs });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - search: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    update(filter, update, options = {}) {
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
            this.collection.updateMany(filter, update, (Object.assign(options || {}, { multi: true, upsert: false })))
                .then(res => {
                this.$logger.debug('update service result:', res);
                resolve({ data: res.result.nModified, count: res.result.nModified });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - update: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    updateOne(filter, update, options = {}) {
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
            let schema = this.$get('schema');
            if (!schema) {
                this.collection.findOneAndUpdate(filter, update, Object.assign(options || {}, { returnOriginal: false })).then(res => {
                    this.$logger.debug('updateOne service result:', res);
                    resolve(res.value);
                })
                    .catch(error => reject({
                    message: `[${this.$get('name')}] - updateOne: unknown error`,
                    original: error,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            }
            else {
                this.collection.findOne(filter)
                    .then(doc => {
                    if (!doc)
                        return resolve({ data: null });
                    let preUpdatedDoc = doc;
                    let docId = preUpdatedDoc._id;
                    let updatedDoc;
                    let errObj;
                    delete preUpdatedDoc._id;
                    this.collection.findOneAndUpdate(filter, update, Object.assign(options || {}, { returnOriginal: false })).then(res => {
                        updatedDoc = res.value;
                        delete updatedDoc._id;
                        let state = schema.test(updatedDoc);
                        if (state) {
                            let props = schema.getProps();
                            if (Object.keys(props).length) {
                                let constants = [], internals = [];
                                for (let prop in props) {
                                    if (props[prop].constant)
                                        constants.push(prop);
                                    else if (props[prop].internal) {
                                        internals.push(prop);
                                    }
                                }
                                if (constants.length) {
                                    let changedField = util_1.objectUtil.compareValues(constants, preUpdatedDoc, updatedDoc);
                                    if (changedField)
                                        errObj = {
                                            message: `[${this.$get('name')}]: '${changedField}' is a constant field that cannot be changed!`,
                                            code: types_1.RESPONSE_CODES.UNAUTHORIZED
                                        };
                                }
                                if (!errObj && internals.length) {
                                    let changedField = util_1.objectUtil.compareValues(internals, preUpdatedDoc, updatedDoc);
                                    if (changedField)
                                        errObj = {
                                            message: `[${this.$get('name')}]: '${changedField}' cannot be modified externaly!`,
                                            code: types_1.RESPONSE_CODES.UNAUTHORIZED
                                        };
                                }
                            }
                        }
                        else {
                            errObj = {
                                message: schema.error.message,
                                original: schema.error,
                                code: types_1.RESPONSE_CODES.BAD_REQUEST
                            };
                        }
                        if (errObj) {
                            this.collection.replaceOne({ _id: docId }, preUpdatedDoc)
                                .then(res => reject(errObj))
                                .catch(error => reject({
                                message: 'error reverting document after update',
                                original: { message: schema.error.message, error: error },
                                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                            }));
                        }
                        else {
                            this.$logger.debug('updateOne service result:', updatedDoc);
                            let selects = schema.getPropsByName('select');
                            selects = selects.filter((item) => item.value === false).map((item) => item.path);
                            if (selects && selects.length)
                                util_1.objectUtil.omit(updatedDoc, selects);
                            resolve({ data: updatedDoc });
                        }
                    })
                        .catch(error => reject({
                        message: `[${this.$get('name')}] - updateOne: unknown error`,
                        original: error,
                        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                    }));
                })
                    .catch(error => reject({
                    message: `[${this.$get('name')}] - findOne: unknown error`,
                    original: error,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            }
        });
    }
    updateById(id, update, options = {}) {
        this.$logger.info('updateById service called');
        this.$logger.debug('id:', id);
        this.$logger.debug('update:', update);
        this.$logger.debug('options:', options);
        return new Promise((resolve, reject) => {
            if (!update || Object.keys(update).length === 0 || !id)
                return resolve({ data: null });
            delete update._id;
            delete update.token;
            let schema = this.$get('schema');
            if (!schema) {
                this.collection.findOneAndUpdate({ _id: new MongoDB.ObjectID(id) }, update, Object.assign(options || {}, { returnOriginal: false })).then(res => {
                    this.$logger.debug('updateById service result:', res);
                    resolve(res.value);
                })
                    .catch(error => reject({
                    message: `[${this.$get('name')}] - updateById: unknown error`,
                    original: error,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            }
            else {
                this.collection.findOne({ _id: new MongoDB.ObjectID(id) })
                    .then(doc => {
                    if (!doc)
                        return resolve({ data: null });
                    let preUpdatedDoc = doc;
                    let updatedDoc;
                    let errObj;
                    delete preUpdatedDoc._id;
                    this.collection.findOneAndUpdate({ _id: new MongoDB.ObjectID(id) }, update, Object.assign(options || {}, { returnOriginal: false })).then(res => {
                        updatedDoc = res.value;
                        delete updatedDoc._id;
                        let state = schema.test(updatedDoc);
                        if (state) {
                            let props = schema.getProps();
                            if (Object.keys(props).length) {
                                let constants = [], internals = [];
                                for (let prop in props) {
                                    if (props[prop].constant)
                                        constants.push(prop);
                                    else if (props[prop].internal) {
                                        internals.push(prop);
                                    }
                                }
                                if (constants.length) {
                                    let changedField = util_1.objectUtil.compareValues(constants, preUpdatedDoc, updatedDoc);
                                    if (changedField)
                                        errObj = {
                                            message: `[${this.$get('name')}]: '${changedField}' is a constant field that cannot be changed!`,
                                            code: types_1.RESPONSE_CODES.UNAUTHORIZED
                                        };
                                }
                                if (!errObj && internals.length) {
                                    let changedField = util_1.objectUtil.compareValues(internals, preUpdatedDoc, updatedDoc);
                                    if (changedField)
                                        errObj = {
                                            message: `[${this.$get('name')}]: '${changedField}' cannot be modified externaly!`,
                                            code: types_1.RESPONSE_CODES.UNAUTHORIZED
                                        };
                                }
                            }
                        }
                        else {
                            errObj = {
                                message: schema.error.message,
                                original: schema.error,
                                code: types_1.RESPONSE_CODES.BAD_REQUEST
                            };
                        }
                        if (errObj) {
                            this.collection.replaceOne({ _id: new MongoDB.ObjectID(id) }, preUpdatedDoc)
                                .then(res => reject(errObj))
                                .catch(error => reject({
                                message: 'error reverting document after update',
                                original: { message: schema.error.message, error: error },
                                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                            }));
                        }
                        else {
                            this.$logger.debug('updateOne service result:', updatedDoc);
                            let selects = schema.getPropsByName('select');
                            selects = selects.filter((item) => item.value === false).map((item) => item.path);
                            if (selects && selects.length)
                                util_1.objectUtil.omit(updatedDoc, selects);
                            resolve({ data: updatedDoc });
                        }
                    })
                        .catch(error => reject({
                        message: `[${this.$get('name')}] - updateOne: unknown error`,
                        original: error,
                        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                    }));
                })
                    .catch(error => reject({
                    message: `[${this.$get('name')}] - findOne: unknown error`,
                    original: error,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            }
        });
    }
    delete(filter, options = {}) {
        this.$logger.info('delete service called');
        this.$logger.debug('filter:', filter);
        this.$logger.debug('options:', options);
        return new Promise((resolve, reject) => {
            if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
                return reject({
                    message: `[${this.$get('name')}] - delete: unsecure process rejection`,
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
            this.collection.deleteMany(filter, options)
                .then(res => {
                this.$logger.debug('delete service result:', res);
                resolve({ data: res.result.n, count: res.result.n });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - delete: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    deleteOne(filter, options = {}) {
        this.$logger.info('deleteOne service called');
        this.$logger.debug('id:', filter);
        this.$logger.debug('options:', options);
        return new Promise((resolve, reject) => {
            if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
                return reject({
                    message: `[${this.$get('name')}] - deleteOne: unsecure process rejection`,
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
            if (filter._id)
                filter._id = new MongoDB.ObjectID(filter._id);
            this.collection.deleteOne(filter, options)
                .then(res => {
                this.$logger.debug('deleteOne service result:', res);
                resolve({ data: res.result.n, count: res.result.n });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - deleteOne: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
    deleteById(id, options = {}) {
        this.$logger.info('deleteById service called');
        this.$logger.debug('id:', id);
        this.$logger.debug('options:', options);
        return new Promise((resolve, reject) => {
            if (!id)
                return resolve({ data: null });
            this.collection.deleteOne({ _id: new MongoDB.ObjectID(id) }, options)
                .then(res => {
                this.$logger.debug('deleteById service result:', res);
                resolve({ data: res.result.n, count: res.result.n });
            })
                .catch(error => reject({
                message: `[${this.$get('name')}] - deleteById: unknown error`,
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        });
    }
}
__decorate([
    decorators_1.FRIEND(safe.set('MongoModel.setCollection', ['mongo']))
], MongoModel.prototype, "setCollection", null);
__decorate([
    decorators_1.SERVICE({
        args: ['query.query', 'query.options']
    })
], MongoModel.prototype, "count", null);
__decorate([
    decorators_1.SERVICE({
        args: ['query.query', 'query.projections', 'query.options']
    })
], MongoModel.prototype, "find", null);
__decorate([
    decorators_1.SERVICE({
        args: ['query.query', 'query.options']
    })
], MongoModel.prototype, "findOne", null);
__decorate([
    decorators_1.SERVICE({
        args: ['params.id', 'query.options']
    })
], MongoModel.prototype, "findById", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.documents', 'body.writeConcern']
    })
], MongoModel.prototype, "insert", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.query', 'body.projections', 'body.options']
    })
], MongoModel.prototype, "search", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter', 'body.update', 'body.options']
    })
], MongoModel.prototype, "update", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter', 'body.update', 'body.options']
    })
], MongoModel.prototype, "updateOne", null);
__decorate([
    decorators_1.SERVICE({
        args: ['params.id', 'body.update', 'body.options']
    })
], MongoModel.prototype, "updateById", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter', 'body.options']
    })
], MongoModel.prototype, "delete", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter', 'body.options']
    })
], MongoModel.prototype, "deleteOne", null);
__decorate([
    decorators_1.SERVICE({
        args: ['params.id', 'body.options']
    })
], MongoModel.prototype, "deleteById", null);
exports.MongoModel = MongoModel;
//# sourceMappingURL=mongo-model.js.map