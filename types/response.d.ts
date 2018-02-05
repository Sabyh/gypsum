import { API_TYPES } from './api-types';
import { RESPONSE_CODES } from './response-codes';
import { RESPONSE_DOMAINS } from './response-domains';
export interface IResponse {
    data: any;
    count?: number;
    code?: RESPONSE_CODES;
    domain?: RESPONSE_DOMAINS;
    requestType?: API_TYPES.REST | API_TYPES.SOCKET;
    event?: string;
    room?: string;
}
export declare class Response {
    data: any;
    count: number;
    code: RESPONSE_CODES;
    domain: RESPONSE_DOMAINS;
    requestType: API_TYPES.REST | API_TYPES.SOCKET;
    event: string;
    success: boolean;
    room: string;
    constructor(options: IResponse);
}
