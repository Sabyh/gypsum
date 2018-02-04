"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
exports.AuthenticationConfig = {
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
    activationPage: path.join(__dirname, '../../../email_templates/activation-page-template.html'),
    activationMailTemplatePath: path.join(__dirname, '../../../email_templates/activation-email-template.html')
};
//# sourceMappingURL=config.js.map