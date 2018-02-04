import { RESPONSE_CODES } from './response-codes';
export interface IResponseError {
    message: string;
    original?: any;
    code?: RESPONSE_CODES;
}
export declare class ResponseError {
    message: string;
    original: any;
    code: RESPONSE_CODES;
    constructor(options: IResponseError);
    toString(): string;
    describe(): IResponseError;
}
