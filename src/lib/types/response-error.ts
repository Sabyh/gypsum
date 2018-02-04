import { RESPONSE_CODES } from './response-codes';

export interface IResponseError {
  message: string,
  original?: any,
  code?: RESPONSE_CODES
}

export class ResponseError {
  message: string;
  original: any;
  code: RESPONSE_CODES;

  constructor(options: IResponseError) {
    this.message = options.message;
    this.original = options.original || options.message;
    this.code = options.code || RESPONSE_CODES.UNKNOWN_ERROR;
  }

  toString(): string {
    return this.message;
  }

  describe(): IResponseError {
    return {
      message: this.message,
      original: this.original,
      code: this.code
    };
  }
}