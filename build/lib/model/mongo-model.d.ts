import * as MongoDB from 'mongodb';
import { Model } from './model';
import { Context } from '../context';
export declare class MongoModel extends Model {
    collection: MongoDB.Collection;
    constructor();
    protected setCollection(collection: MongoDB.Collection): void;
    protected onCollection(): void;
    count(ctx: Context): void;
    find(ctx: Context): void;
    findOne(ctx: Context): void;
    findById(ctx: Context): void;
    insert(ctx: Context): void;
    search(ctx: Context): void;
    update(ctx: Context): void;
    updateOne(ctx: Context): void;
    updateById(ctx: Context): void;
    delete(ctx: Context): void;
    deleteOne(ctx: Context): void;
    deleteById(ctx: Context): void;
}
