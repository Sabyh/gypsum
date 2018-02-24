"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_types_1 = require("./api-types");
const response_codes_1 = require("./response-codes");
const index_1 = require("./index");
class Response {
    constructor(options) {
        this.data = options.data;
        this.code = options.code || (options.data instanceof index_1.ResponseError ? options.data.code : response_codes_1.RESPONSE_CODES.OK);
        this.success = this.success !== undefined ? !!options.success : (this.code >= 200 && this.code < 300 ? true : false);
        this.domain = options.domain || 0;
        this.apiType = options.apiType || api_types_1.API_TYPES.REST;
        this.event = options.event || "";
        this.room = options.room || "";
        this.type = options.type || 'json';
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
exports.Response = Response;
//# sourceMappingURL=response.js.map