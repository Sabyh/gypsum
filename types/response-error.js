"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_codes_1 = require("./response-codes");
class ResponseError {
    constructor(options) {
        this.message = options.message;
        this.original = options.original || options.message;
        this.code = options.code || response_codes_1.RESPONSE_CODES.UNKNOWN_ERROR;
    }
    toString() {
        return this.message;
    }
    describe() {
        return {
            message: this.message,
            original: this.original,
            code: this.code
        };
    }
}
exports.ResponseError = ResponseError;
//# sourceMappingURL=response-error.js.map