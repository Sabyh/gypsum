"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compress = require("compression");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const state_1 = require("../../state");
const search_query_1 = require("../../middlewares/search-query");
const logger_1 = require("../../misc/logger");
function configure(app, appName, logger) {
    logger = logger || new logger_1.Logger(appName);
    app.use((req, res, next) => {
        logger.info(`request: ${req.method} - ${req.originalUrl}`);
        next();
    });
    logger.info('impliminting express middlewares..');
    if (state_1.State.env === 'production')
        app.use(compress());
    app.use(cookieParser(state_1.State.config.cookie_key));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json({ limit: `${state_1.State.config.upload_size_limit_mb}mb` }));
    app.use(methodOverride());
    app.use(search_query_1.searchQuery);
    app.disable('x-powered-by');
}
exports.configure = configure;
//# sourceMappingURL=configure_app.js.map