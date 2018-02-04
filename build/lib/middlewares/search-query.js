"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_1 = require("../util/object");
function searchQuery(req, res, next) {
    let query = req.originalUrl.split('?')[1];
    if (query && typeof query === 'string')
        req.query = object_1.objectUtil.toQueryObject(query);
    next();
}
exports.searchQuery = searchQuery;
//# sourceMappingURL=search-query.js.map