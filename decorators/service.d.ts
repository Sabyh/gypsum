import * as Validall from 'validall';
import { API_TYPES } from '../types/api-types';
import { RESPONSE_DOMAINS } from '../types/response-domains';
import { IHookOptions } from './hook';
export interface IService {
    isService: boolean;
    secure: boolean;
    authorize: boolean | string[];
    internal: boolean;
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
    secure?: boolean;
    internal?: boolean;
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
