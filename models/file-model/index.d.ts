import { FileCollection } from './collection';
import { Model } from '../model';
import { IResponse } from '../../types';
export declare class FileModel extends Model {
    protected collection: FileCollection;
    constructor();
    find(query: any, projections: string, options: any): Promise<IResponse>;
    findById(id: string, projections: string): Promise<IResponse>;
    findOne(query: any, projections: string): Promise<IResponse>;
    count(query: any): Promise<IResponse>;
    search(query: any, projections: string, options: any): Promise<IResponse>;
    insert(documents: any): Promise<IResponse>;
    update(filter: any, update: any, options: any): Promise<IResponse>;
    updateById(id: string, update: any): Promise<IResponse>;
    updateOne(filter: any, update: any): Promise<IResponse>;
    delete(filter: any, options: any): Promise<IResponse>;
    deleteById(id: string): Promise<IResponse>;
    deleteOne(filter: any): Promise<IResponse>;
}
