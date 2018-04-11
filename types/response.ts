import { API_TYPES } from './api-types';
import { RESPONSE_CODES } from './response-codes';
import { RESPONSE_DOMAINS } from './response-domains';
import { ResponseError, IResponseError } from './index';

export type responseTypes = 'json' | 'html' | 'file';

export interface IResponse {
  data?: any;
  count?: number;
  code?: RESPONSE_CODES;
  domain?: RESPONSE_DOMAINS;
  apiType?: API_TYPES.REST | API_TYPES.SOCKET;
  event?: string;
  room?: string;
  success?: boolean;
  type?: responseTypes;
  error?: IResponseError;
}

export class Response {
  data: any;
  count: number;
  code: RESPONSE_CODES;
  domain: RESPONSE_DOMAINS;
  apiType: API_TYPES.REST | API_TYPES.SOCKET;
  event: string;
  success: boolean;
  room: string;
  type: responseTypes;
  error: IResponseError | undefined;

  constructor(options: IResponse) {
    this.data = options.data;
    this.code = options.code || <any>(options.error ? options.error.code : RESPONSE_CODES.OK);
    this.success = this.success !== undefined ? !!options.success : (this.code >= 200 && this.code < 300 ? true : false);
    this.domain = options.domain || 0;
    this.apiType = options.apiType || API_TYPES.REST;
    this.event = options.event || "";
    this.room = options.room || "";
    this.type = options.type || 'json';
    this.error = options.error;

    if (options.count !== undefined)
      this.count === options.count;
    else
      this.count = Array.isArray(this.data) ? this.data.length : (this.data ? 1 : 0);

    if (!this.count && this.data) {
      if (Array.isArray(this.data))
        this.count = this.data.length;
      else
        this.count = 1;
    }
  }
}