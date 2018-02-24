"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = {
    dev: {
        server: {
            server_name: 'gypsum',
            secure: false,
            origin: "http://localhost:7771",
            port: 7771,
            host: "localhost",
            services_prefix: "apis",
            statics: ['static'],
            files_data_dir: ".data",
            processes: 1,
            cookie_key: 'kdu8v9qwem8hqe',
            upload_size_limit_mb: 10,
            logger_options: { all: 'debug' },
            authentication: false,
            authorization: false,
            mongodb_url: 'mongodb://localhost:27017',
            database_name: 'gypsum_dev_db',
            spa: ''
        }
    },
    prod: {
        server: {
            secure: true,
            origin: "http://localhost",
            processes: 'max',
            logger_options: { all: "error" },
            database_name: 'gypsum_db'
        }
    }
};
//# sourceMappingURL=config.js.map