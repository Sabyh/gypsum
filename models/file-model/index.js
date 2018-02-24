"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validall = require("validall");
const collection_1 = require("./collection");
const model_1 = require("../model");
const types_1 = require("../../types");
const decorators_1 = require("../../decorators");
class FileModel extends model_1.Model {
    constructor() {
        super();
        this.collection = new collection_1.FileCollection(this.$get('name'), this.$get('schema'));
        this.type = 'File';
    }
    find(query = {}, projections, options) {
        return new Promise((resolve, reject) => {
            this.$logger.info('find service called');
            this.$logger.debug('query:', query);
            this.$logger.debug('projections:', projections);
            this.$logger.debug('options:', options);
            this.collection.find(query, projections, options)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    findById(id, projections) {
        return new Promise((resolve, reject) => {
            this.$logger.info('findById service called');
            this.$logger.debug('id:', id);
            this.$logger.debug('projections:', projections);
            this.collection.findById(id, projections)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    findOne(query, projections) {
        return new Promise((resolve, reject) => {
            this.$logger.info('findOne service called');
            this.$logger.debug('query:', query);
            this.$logger.debug('projections:', projections);
            this.collection.findById(query, projections)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    count(query) {
        return new Promise((resolve, reject) => {
            this.$logger.info('count service called');
            this.$logger.debug('query:', query);
            this.collection.count(query)
                .then(res => resolve({ data: res, count: res }))
                .catch((error) => reject(error));
        });
    }
    search(query, projections, options) {
        return new Promise((resolve, reject) => {
            this.$logger.info('search service called');
            this.$logger.debug('query:', query);
            this.$logger.debug('projections:', projections);
            this.$logger.debug('options:', options);
            this.collection.find(query, projections, options)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    insert(documents) {
        return new Promise((resolve, reject) => {
            this.$logger.info('insert service called');
            this.$logger.debug('documents:', documents);
            this.collection.insert(documents)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    update(filter, update, options) {
        return new Promise((resolve, reject) => {
            this.$logger.info('update service called');
            this.$logger.debug('filter:', filter);
            this.$logger.debug('update:', update);
            this.$logger.debug('options:', options);
            this.collection.update(filter, update, options)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    updateById(id, update) {
        return new Promise((resolve, reject) => {
            this.$logger.info('update service called');
            this.$logger.debug('id:', id);
            this.$logger.debug('update:', update);
            this.collection.updateById(id, update)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    updateOne(filter, update) {
        return new Promise((resolve, reject) => {
            this.$logger.info('update service called');
            this.$logger.debug('filter:', filter);
            this.$logger.debug('update:', update);
            this.collection.updateOne(filter, update)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    delete(filter, options) {
        return new Promise((resolve, reject) => {
            this.$logger.info('delete service called');
            this.$logger.debug('filter:', filter);
            this.$logger.debug('filter:', options);
            if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
                return reject({
                    message: `[${this.$get('name')}] - delete: unsecure process rejection`,
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
            this.collection.delete(filter, options)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    deleteById(id) {
        return new Promise((resolve, reject) => {
            this.$logger.info('deleteById service called');
            this.$logger.debug('id:', id);
            if (!id)
                return reject({
                    message: `[${this.$get('name')}] - deleteById: document id is required.`,
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
            this.collection.deleteById(id)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
    deleteOne(filter) {
        return new Promise((resolve, reject) => {
            this.$logger.info('deleteOne service called');
            this.$logger.debug('filter:', filter);
            if (!Validall(filter, { $type: 'object', $keys: { $length: { $gt: 0 } } }))
                return reject({
                    message: `[${this.$get('name')}] - deleteOne: unsecure process rejection`,
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
            this.collection.deleteById(filter)
                .then(res => resolve({ data: res }))
                .catch((error) => reject(error));
        });
    }
}
__decorate([
    decorators_1.SERVICE({
        args: ['query.query', 'query.projections', 'query.options']
    })
], FileModel.prototype, "find", null);
__decorate([
    decorators_1.SERVICE({
        args: ['params.id', 'query.projections']
    })
], FileModel.prototype, "findById", null);
__decorate([
    decorators_1.SERVICE({
        args: ['query.query', 'query.projections']
    })
], FileModel.prototype, "findOne", null);
__decorate([
    decorators_1.SERVICE({
        args: ['query.query']
    })
], FileModel.prototype, "count", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.query', 'body.projections', 'body.options']
    })
], FileModel.prototype, "search", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.documents']
    })
], FileModel.prototype, "insert", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter', 'body.update', 'body.options']
    })
], FileModel.prototype, "update", null);
__decorate([
    decorators_1.SERVICE({
        args: ['params.id', 'body.update']
    })
], FileModel.prototype, "updateById", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter', 'body.update']
    })
], FileModel.prototype, "updateOne", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter', 'body.options']
    })
], FileModel.prototype, "delete", null);
__decorate([
    decorators_1.SERVICE({
        args: ['params.id']
    })
], FileModel.prototype, "deleteById", null);
__decorate([
    decorators_1.SERVICE({
        args: ['body.filter']
    })
], FileModel.prototype, "deleteOne", null);
exports.FileModel = FileModel;
//# sourceMappingURL=index.js.map