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
        this.collection = new collection_1.FileCollection(this.$get('name'), { schema: this.$get('schema'), schemaOptions: this.$get('schemaOptions') });
        this.type = 'File';
    }
    find(ctx) {
        this.$logger.info('find service called');
        this.$logger.debug('query:', ctx.query.query);
        this.$logger.debug('projection:', ctx.query.projection);
        this.$logger.debug('options:', ctx.query.options);
        this.collection.find(ctx.query.query, ctx.query.projection, ctx.query.options)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    findById(ctx) {
        this.$logger.info('findById service called');
        this.$logger.debug('id:', ctx.params.id);
        this.$logger.debug('projections:', ctx.query.projections);
        this.collection.findById(ctx.params.id, ctx.query.projections)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    findOne(ctx) {
        this.$logger.info('findOne service called');
        this.$logger.debug('query:', ctx.query.query);
        this.$logger.debug('projections:', ctx.query.projections);
        this.collection.findById(ctx.query.query, ctx.query.projections)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    count(ctx) {
        this.$logger.info('count service called');
        this.$logger.debug('query:', ctx.query.query);
        this.collection.count(ctx.query.query)
            .then(res => ctx.ok(res, res))
            .catch((error) => ctx.next(error));
    }
    search(ctx) {
        this.$logger.info('search service called');
        this.$logger.debug('query:', ctx.body.query);
        this.$logger.debug('projections:', ctx.body.projections);
        this.$logger.debug('options:', ctx.body.options);
        this.collection.find(ctx.body.query, ctx.body.projections, ctx.body.option)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    insert(ctx) {
        this.$logger.info('insert service called');
        this.$logger.debug('documents:', ctx.body);
        this.collection.insert(ctx.body)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    insertOne(ctx) {
        this.$logger.info('insertOne service called');
        this.$logger.debug('document:', ctx.body);
        this.collection.insert(ctx.body)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    update(ctx) {
        this.$logger.info('update service called');
        this.$logger.debug('filter:', ctx.body.filter);
        this.$logger.debug('update:', ctx.body.update);
        this.$logger.debug('options:', ctx.body.options);
        this.collection.update(ctx.body.filter, ctx.body.update, ctx.body.options)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    updateById(ctx) {
        this.$logger.info('update service called');
        this.$logger.debug('id:', ctx.params.id);
        this.$logger.debug('update:', ctx.body.update);
        this.$logger.debug('options:', ctx.body.options);
        this.collection.updateById(ctx.params.id, ctx.body.update)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    updateOne(ctx) {
        this.$logger.info('update service called');
        this.$logger.debug('filter:', ctx.body.filter);
        this.$logger.debug('update:', ctx.body.update);
        this.$logger.debug('options:', ctx.body.options);
        this.collection.updateOne(ctx.body.filter, ctx.body.update)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    delete(ctx) {
        this.$logger.info('delete service called');
        this.$logger.debug('filter:', ctx.body.filter);
        this.$logger.debug('filter:', ctx.body.options);
        let nofilter = !Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } } });
        if (nofilter)
            return ctx.next({
                message: `[${this.$get('name')}] - delete: unsecure process rejection`,
                code: types_1.RESPONSE_CODES.UNAUTHORIZED
            });
        this.collection.delete(ctx.body.filter, ctx.body.options)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    deleteById(ctx) {
        this.$logger.info('deleteById service called');
        this.$logger.debug('id:', ctx.params.id);
        this.$logger.debug('filter:', ctx.body.options);
        this.collection.deleteById(ctx.params.id)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
    deleteOne(ctx) {
        this.$logger.info('deleteOne service called');
        this.$logger.debug('filter:', ctx.body.filter);
        this.$logger.debug('filter:', ctx.body.options);
        let nofilter = !Validall(ctx.body.filter, { $type: 'object', $keys: { $length: { $gt: 0 } } });
        if (nofilter)
            return ctx.next({
                message: `[${this.$get('name')}] - deleteOne: unsecure process rejection`,
                code: types_1.RESPONSE_CODES.UNAUTHORIZED
            });
        this.collection.deleteById(ctx.body.filter)
            .then(res => ctx.ok(res))
            .catch((error) => ctx.next(error));
    }
}
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "find", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "findById", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "findOne", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "count", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "search", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "insert", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "insertOne", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "update", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "updateById", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "updateOne", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "delete", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "deleteById", null);
__decorate([
    decorators_1.SERVICE()
], FileModel.prototype, "deleteOne", null);
exports.FileModel = FileModel;
//# sourceMappingURL=index.js.map