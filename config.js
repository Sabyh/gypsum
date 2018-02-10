"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.Config = {
    dev: {
        authConfig: {
            rootUser: 'root',
            rootUserEmail: 'root@admin.com',
            rootPassword: 'admin',
            usersModel: 'Users',
            userEmailField: 'email',
            userIdField: 'userid',
            usernameField: 'username',
            passwordField: 'password',
            passwordSaltField: 'passwordSalt',
            userIsActiveField: 'isActive',
            tokenFieldName: 'token',
            tokenSecret: '4s8e1doenf3q2d6q2x4fv12',
            usernamePattern: '/[a-zA-Z0-9_]{5,}/',
            passwordpattern: '/[a-zA-Z0-9_]{5,}/',
            tranporterOptions: null,
            activationMailFrom: 'me@threre.com',
            activationMailSubject: 'Activation Email',
            activationPage: path.join(__dirname, '../templates/activation-page-template.html'),
            activationMailTemplatePath: path.join(__dirname, '../templates/activation-email-template.html')
        },
        server: {
            server_name: 'gypsum',
            origin: "http://localhost",
            port: 7771,
            host: "http://localhost:7771",
            services_prefix: "apis",
            statics: ['static'],
            files_data_dir: ".data",
            mongodb_url: "mongodb://localhost:27017/gypsum_dev_db",
            mongo_database_name: 'test',
            processes: 1,
            cookie_key: 'kdu8v9qwem8hqe',
            upload_size_limit_mb: 10,
            logger_options: { all: 'debug' },
            authentication: false,
            authorization: false
        }
    },
    prod: {
        server: {
            origin: "http://localhost",
            mongodb_url: "mongodb://localhost:27017/gypsum_db",
            processes: 'max',
            logger_options: { all: "error" }
        }
    }
};
//# sourceMappingURL=config.js.map