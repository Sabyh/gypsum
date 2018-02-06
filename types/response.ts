import { API_TYPES } from './api-types';
import { RESPONSE_CODES } from './response-codes';
import { RESPONSE_DOMAINS } from './response-domains';
import { ResponseError } from './index';

export interface IResponse {
  data: any;
  count?: number;
  code?: RESPONSE_CODES;
  domain?: RESPONSE_DOMAINS;
  requestType?: API_TYPES.REST | API_TYPES.SOCKET;
  event?: string;
  room?: string;
}

export class Response {
  data: any;
  count: number;
  code: RESPONSE_CODES;
  domain: RESPONSE_DOMAINS;
  requestType: API_TYPES.REST | API_TYPES.SOCKET;
  event: string;
  success: boolean;
  room: string;

  constructor(options: IResponse) {
    this.data = options.data;
    this.code = options.code || (options.data instanceof ResponseError ? options.data.code : RESPONSE_CODES.OK);
    this.success = this.code >= 200 && this.code < 300 ? true : false;
    this.domain = options.domain || 0;
    this.requestType = options.requestType || API_TYPES.REST;
    this.event = options.event || "";
    this.count = options.count || 0;
    this.room = options.room || "";

    if (!this.count && this.data) {
      if (Array.isArray(this.data))
        this.count = this.data.length;
      else
        this.count = 1;
    }
  }
}