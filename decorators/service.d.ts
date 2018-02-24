import { RESPONSE_DOMAINS, API_TYPES } from '../types';
import * as Validall from 'validall';
import { IHookOptions } from './hook';
export interface IService {
    isService: boolean;
    __name: string;
    secure: boolean;
    authorize: boolean | string[];
    args: string[];
    name: string;
    method: "get" | "post" | "put" | "delete";
    apiType: API_TYPES;
    domain: RESPONSE_DOMAINS;
    path: string;
    event: string;
    params: string[];
    before: IHookOptions[];
    after: IHookOptions[];
    validate: {
        query?: Validall.ISchema;
        body?: Validall.ISchema;
        user?: Validall.ISchema;
    };
}
export interface IServiceOptions {
    args?: string[];
    secure?: boolean;
    authorize?: boolean | string[];
    method?: "get" | "post" | "put" | "delete";
    apiType?: API_TYPES;
    domain?: RESPONSE_DOMAINS;
    path?: string;
    event?: string;
    params?: string[];
    before?: IHookOptions[];
    after?: IHookOptions[];
    validate?: {
        query?: Validall.ISchema;
        body?: Validall.ISchema;
        user?: Validall.ISchema;
    };
}
export declare function SERVICE(options?: IServiceOptions): (target: any, key: string, descriptor: PropertyDescriptor) => void;
