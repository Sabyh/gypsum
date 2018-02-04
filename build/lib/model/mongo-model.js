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
    count(ctx) {
        this.$logger.info('count service called');
        this.$logger.debug('query:', ctx.query.query);
        this.$logger.debug('options:', ctx.query.options);
        ctx.query = ctx.query || { query: {}, options: {} };
        if (!ctx.query.query || Object.keys(ctx.query.query).length === 0)
            ctx.query.query = {};
        if (ctx.query.query._id)
            ctx.query.query._id = new MongoDB.ObjectID(ctx.query.query._id);
        this.collection.count(ctx.query.query || {}, ctx.query.options)
            .then(count => {
            this.$logger.debug('count service result:', count);
            ctx.ok(count, count);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - count: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    find(ctx) {
        this.$logger.info('find service called');
        this.$logger.debug('query:', ctx.query.query);
        this.$logger.debug('projections:', ctx.query.projections);
        this.$logger.debug('options:', ctx.query.options);
        ctx.query = ctx.query || { query: {}, projections: {}, options: {} };
        if (!ctx.query.query || Object.keys(ctx.query.query).length === 0)
            ctx.query.query = {};
        if (ctx.query.query._id)
            ctx.query.query._id = new MongoDB.ObjectID(ctx.query.query._id);
        let cursor = this.collection.find(ctx.query.query, ctx.query.projections);
        for (let prop in ctx.query.options)
            if (prop in cursor)
                cursor[prop](ctx.query.options[prop]);
        cursor
            .toArray()
            .then(docs => {
            this.$logger.debug('find service result:', docs);
            ctx.ok(docs);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - find: unkown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    findOne(ctx) {
        this.$logger.info('findOne service called');
        this.$logger.debug('query:', ctx.query.query);
        this.$logger.debug('options:', ctx.query.options);
        ctx.query = ctx.query || { query: {}, options: {} };
        if (!ctx.query.query || Object.keys(ctx.query.query).length === 0)
            return ctx.ok(null);
        if (ctx.query.query._id)
            ctx.query.query._id = new MongoDB.ObjectID(ctx.query.query._id);
        this.collection.findOne(ctx.query.query, ctx.query.options)
            .then(doc => {
            this.$logger.debug('findOne service result:', doc);
            ctx.ok(doc);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - findOne: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    findById(ctx) {
        this.$logger.info('findById service called');
        this.$logger.debug('id:', ctx.params.id);
        this.$logger.debug('options:', ctx.query.options);
        if (!ctx.params.id)
            return ctx.ok(null);
        this.collection.findOne({ _id: new MongoDB.ObjectID(ctx.params.id) }, ctx.query.options)
            .then(doc => {
            this.$logger.debug('findById service result:', doc);
            ctx.ok(doc);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - findById: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    insert(ctx) {
        this.$logger.info('insert service called');
        this.$logger.debug('documents:', ctx.body.documents);
        this.$logger.debug('writeConcern:', ctx.body.writeConcern);
        if (!ctx.body || !ctx.body.documents)
            return ctx.ok(null);
        ctx.body.documents = Array.isArray(ctx.body.documents) ? ctx.body.documents : [ctx.body.documents];
        for (let i = 0; i < ctx.body.documents.length; i++)
            delete ctx.body.documents[i]._id;
        let schema = this.$get('schema');
        if (schema)
            if (!schema.test(ctx.body.documents))
                return ctx.next({
                    message: schema.error.message,
                    original: schema.error,
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
        this.collection.insertMany(ctx.body.documents, ctx.body.writeConcern)
            .then(res => {
            this.$logger.debug('insert service result:');
            this.$logger.debug(JSON.stringify(res, null, 4));
            ctx.ok(ctx.body.documents.length === 1 ? res.ops[0] : res.ops);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - insert: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    search(ctx) {
        this.$logger.info('search service called');
        this.$logger.debug('query:', ctx.body.query);
        this.$logger.debug('projections:', ctx.body.projections);
        this.$logger.debug('options:', ctx.body.options);
        ctx.body = ctx.body || { query: {}, projections: {}, options: {} };
        if (!ctx.body.query || Object.keys(ctx.body.query).length === 0)
            ctx.body.query = {};
        if (ctx.body.query._id)
            ctx.body.query._id = new MongoDB.ObjectID(ctx.body.query._id);
        let cursor = this.collection.find(ctx.body.query, ctx.body.projections);
        for (let prop in ctx.body.options)
            if (cursor[prop])
                cursor[prop](ctx.body.options[prop]);
        cursor
            .toArray()
            .then(docs => {
            this.$logger.debug('search service result:', docs);
            ctx.ok(docs);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - search: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    update(ctx) {
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
        this.collection.updateMany(ctx.body.filter, ctx.body.update, (Object.assign(ctx.body.options || {}, { multi: true, upsert: false })))
            .then(res => {
            this.$logger.debug('update service result:', res);
            ctx.ok(res.result.nModified);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - update: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    updateOne(ctx) {
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
        this.collection.findOneAndUpdate(ctx.body.filter, ctx.body.update, Object.assign(ctx.body.options || {}, { returnOriginal: false })).then(res => {
            this.$logger.debug('updateOne service result:', res);
            ctx.ok(res.value);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - updateOne: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    updateById(ctx) {
        this.$logger.info('updateById service called');
        this.$logger.debug('id:', ctx.params.id);
        this.$logger.debug('update:', ctx.body.update);
        this.$logger.debug('options:', ctx.body.options);
        ctx.body = ctx.body || { filter: {}, options: {} };
        if (!ctx.body.update || Object.keys(ctx.body.update).length === 0 || !ctx.params.id)
            return ctx.ok(null);
        delete ctx.body.update._id;
        delete ctx.body.update.token;
        this.collection.findOneAndUpdate({ _id: new MongoDB.ObjectID(ctx.params.id) }, ctx.body.update, Object.assign(ctx.body.options || {}, { returnOriginal: false })).then(res => {
            this.$logger.debug('updateById service result:', res);
            ctx.ok(res.value);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - updateById: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    delete(ctx) {
        this.$logger.info('delete service called');
        this.$logger.debug('filter:', ctx.body.filter);
        this.$logger.debug('options:', ctx.body.options);
        let nofilter = !Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } } });
        if (nofilter)
            return ctx.next({
                message: `[${this.$get('name')}] - delete: unsecure process rejection`,
                code: types_1.RESPONSE_CODES.UNAUTHORIZED
            });
        this.collection.deleteMany(ctx.body.filter, ctx.body.options)
            .then(res => {
            this.$logger.debug('delete service result:', res);
            ctx.ok(res.result.n, res.result.n);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - delete: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    deleteOne(ctx) {
        this.$logger.info('deleteOne service called');
        this.$logger.debug('id:', ctx.body.filter);
        this.$logger.debug('options:', ctx.body.options);
        if (!Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
            return ctx.next({
                message: `[${this.$get('name')}] - deleteOne: unsecure process rejection`,
                code: types_1.RESPONSE_CODES.UNAUTHORIZED
            });
        if (ctx.body.filter._id)
            ctx.body.filter._id = new MongoDB.ObjectID(ctx.body.filter._id);
        this.collection.deleteOne(ctx.body.filter, ctx.body.options)
            .then(res => {
            this.$logger.debug('deleteOne service result:', res);
            ctx.ok(res.result.n, res.result.n);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - deleteOne: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    deleteById(ctx) {
        this.$logger.info('deleteById service called');
        this.$logger.debug('id:', ctx.params.id);
        this.$logger.debug('options:', ctx.body.options);
        if (!ctx.params.id)
            return ctx.ok(null);
        this.collection.deleteOne({ _id: new MongoDB.ObjectID(ctx.params.id) }, ctx.body.options)
            .then(res => {
            this.$logger.debug('deleteById service result:', res);
            ctx.ok(res.result.n, res.result.n);
        })
            .catch(error => ctx.next({
            message: `[${this.$get('name')}] - deleteById: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
}
__decorate([
    decorators_1.FRIEND(safe.set('MongoModel.setCollection', ['mongo']))
], MongoModel.prototype, "setCollection", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "count", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "find", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "findOne", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "findById", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "insert", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "search", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "update", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "updateOne", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "updateById", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "delete", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "deleteOne", null);
__decorate([
    decorators_1.SERVICE()
], MongoModel.prototype, "deleteById", null);
exports.MongoModel = MongoModel;
//# sourceMappingURL=mongo-model.js.map