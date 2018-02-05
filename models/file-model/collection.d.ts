import * as Validall from 'validall';
import { Logger } from '../../misc/logger';
export declare namespace FileCollection {
    interface Document {
        _id: string;
        [key: string]: any;
    }
    interface IFindOptions {
        skip?: number;
        limit?: number;
    }
    interface IUpdateOptions {
        multi: boolean;
        returnDoc?: boolean;
    }
    interface IDeleteOptions {
        limit?: number;
        returnDoc?: boolean;
    }
    interface ICollectionOptions {
        findOptions?: IFindOptions;
        updateOptions?: IUpdateOptions;
        deleteOptions?: IDeleteOptions;
    }
}
export interface IFileData {
    indexes: string[];
    documents: FileCollection.Document[];
}
export declare class FileCollection {
    protected filename: string;
    protected filePath: string;
    protected schema: Validall.Schema | null;
    protected findOptions: FileCollection.IFindOptions;
    protected updateOptions: FileCollection.IUpdateOptions;
    protected deleteOptions: FileCollection.IDeleteOptions;
    logger: Logger;
    constructor(name: string, schema?: {
        schema: Validall.Schema;
        schemaOptions?: Validall.ISchemaOptions;
    }, options?: FileCollection.ICollectionOptions);
    protected read(): Promise<IFileData>;
    protected write(data: IFileData): Promise<boolean>;
    find(query: Validall.ISchema, projection?: string, options?: FileCollection.IFindOptions): Promise<FileCollection.Document[]>;
    findById(id: string, projection?: string): Promise<FileCollection.Document>;
    findOne(query: Validall.ISchema, projection?: string): Promise<FileCollection.Document>;
    count(query: Validall.ISchema): Promise<number>;
    insert(documents: any[]): Promise<FileCollection.Document[]>;
    update(filter: Validall.ISchema, update: any, options?: FileCollection.IUpdateOptions): Promise<FileCollection.Document[] | number>;
    updateById(id: string, update: any): Promise<FileCollection.Document>;
    updateOne(filter: Validall.ISchema, update: any): Promise<FileCollection.Document>;
    delete(filter: Validall.ISchema, options?: FileCollection.IDeleteOptions): Promise<FileCollection.Document[] | number>;
    deleteById(id: string): Promise<FileCollection.Document>;
    deleteOne(filter: Validall.ISchema): Promise<FileCollection.Document>;
}
