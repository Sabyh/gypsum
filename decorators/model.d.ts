import * as MongoDB from 'mongodb';
import * as Validall from 'validall';
import { API_TYPES, RESPONSE_DOMAINS, IHookOptions } from '../types';
export interface IAuthorizeOption {
    roles?: string | string[];
    groups?: string | string[];
    fields?: string | string[];
}
export interface IModelOptions {
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
