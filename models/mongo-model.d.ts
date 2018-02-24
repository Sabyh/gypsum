import * as MongoDB from 'mongodb';
import { Model } from './model';
import { IResponse } from '../types';
export declare class MongoModel extends Model {
    protected collection: MongoDB.Collection;
    constructor();
    protected setCollection(collection: MongoDB.Collection): void;
    protected onCollection(): void;
    count(query?: any, options?: any): Promise<IResponse>;
    find(query?: any, projections?: any, options?: any): Promise<IResponse>;
    findOne(query: any, options?: any): Promise<IResponse>;
    findById(id: string, options?: any): Promise<IResponse>;
    insert(documents: any, writeConcern?: any): Promise<IResponse>;
    search(query?: any, projections?: any, options?: any): Promise<IResponse>;
    update(filter: any, update: any, options?: {}): Promise<IResponse>;
    updateOne(filter: any, update: any, options?: any): Promise<IResponse>;
    updateById(id: string, update: any, options?: any): Promise<IResponse>;
    delete(filter: any, options?: any): Promise<IResponse>;
    deleteOne(filter: any, options?: any): Promise<IResponse>;
    deleteById(id: string, options?: any): Promise<IResponse>;
}
