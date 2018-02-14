import * as MongoDB from 'mongodb';
import * as Validall from 'validall';
import { API_TYPES, RESPONSE_DOMAINS } from '../types';
import { IHookOptions } from './hook';
export interface IModelOptions {
    app?: string;
    secure?: boolean;
    authorize?: boolean;
    accessable?: boolean | string[];
    internal?: boolean;
    eliminate?: string[];
    apiType?: API_TYPES;
    domain?: RESPONSE_DOMAINS;
    before?: IHookOptions[];
    after?: IHookOptions[];
    schema?: Validall.Schema | Validall.ISchema;
    schemaOptions?: Validall.ISchemaOptions;
    indexes?: {
        name: string;
        options?: MongoDB.IndexOptions;
    }[];
}
export declare function MODEL(options?: IModelOptions): (Target: any) => void;
