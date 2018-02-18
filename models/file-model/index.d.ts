import { FileCollection } from './collection';
import { Model } from '../model';
import { Context } from '../../context';
export declare class FileModel extends Model {
    collection: FileCollection;
    constructor();
    find(ctx: Context): void;
    findById(ctx: Context): void;
    findOne(ctx: Context): void;
    count(ctx: Context): void;
    search(ctx: Context): void;
    insert(ctx: Context): void;
    update(ctx: Context): void;
    updateById(ctx: Context): void;
    updateOne(ctx: Context): void;
    delete(ctx: Context): void;
    deleteById(ctx: Context): void;
    deleteOne(ctx: Context): void;
}
