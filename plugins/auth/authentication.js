"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const MongoDB = require("mongodb");
const Validall = require("validall");
const jwt = require("jsonwebtoken");
const nodemailer_1 = require("nodemailer");
const state_1 = require("../../state");
const models_1 = require("../../models");
const types_1 = require("../../types");
const decorators_1 = require("../../decorators");
const util_1 = require("../../util");
function initAuthentication(authConfig, transporterOptions) {
    let UserConstructor = authConfig.usersModelConstructor || models_1.MongoModel;
    let modelName = UserConstructor.prototype.__name || UserConstructor.name;
    let Authentication = class Authentication extends UserConstructor {
        constructor() {
            super();
            if (transporterOptions) {
                this.transporter = nodemailer_1.createTransport(transporterOptions);
            }
            else {
                nodemailer_1.createTestAccount((err, account) => {
                    if (err)
                        throw err;
                    this.transporter = nodemailer_1.createTransport({
                        host: 'smtp.ethereal.email',
                        port: 587,
                        secure: false,
                        auth: {
                            user: account.user,
                            pass: account.pass
                        }
                    });
                });
            }
        }
        getRootUser() {
            return new Promise((resolve, reject) => {
                this.$logger.info('getting root user: ' + authConfig.rootUser);
                this.collection.findOne({ username: authConfig.rootUser })
                    .then(doc => {
                    resolve(doc);
                })
                    .catch(error => reject(error));
            });
        }
        createRootUser() {
            this.$logger.info('creating root user: ' + authConfig.rootUser);
            return new Promise((resolve, reject) => {
                util_1.hash(authConfig.rootUserPassword)
                    .then(results => {
                    this.collection.insertOne({
                        [authConfig.usernameField]: authConfig.rootUser,
                        [authConfig.userEmailField]: authConfig.rootUserEmail,
                        [authConfig.passwordField]: results[0],
                        [authConfig.passwordSaltField]: results[1],
                        [authConfig.userIsActiveField]: true
                    })
                        .then(doc => {
                        if (doc)
                            resolve(doc);
                        else
                            reject('unable to create root user');
                    })
                        .catch(error => reject(error));
                })
                    .catch(error => reject(error));
            });
        }
        pushToken(ctx) {
            return new Promise((resolve, reject) => {
                let responseData = ctx.getResponseData();
                if (!responseData || Array.isArray(responseData) || !Validall.Types.object(responseData))
                    return resolve();
                responseData[authConfig.tokenFieldName] = jwt.sign({ id: responseData._id }, authConfig.tokenSecret);
                resolve();
            });
        }
        secure(ctx) {
            return new Promise((resolve, reject) => {
                if (ctx.user && ctx.apiType === types_1.API_TYPES.SOCKET)
                    resolve();
                let token = ctx.getHeader(authConfig.tokenFieldName) || ctx.query[authConfig.tokenFieldName] || ctx.cookies(authConfig.tokenFieldName) || ctx.body[authConfig.tokenFieldName];
                if (!token)
                    return reject({
                        message: 'user token is missing',
                        code: types_1.RESPONSE_CODES.UNAUTHORIZED
                    });
                let data = jwt.verify(token, authConfig.tokenSecret);
                if (!data.id)
                    return reject({
                        message: 'invalid user token',
                        code: types_1.RESPONSE_CODES.UNAUTHORIZED
                    });
                this.collection.findOne({ _id: new MongoDB.ObjectID(data.id) })
                    .then(doc => {
                    if (!doc || !Object.keys(doc).length)
                        return reject({
                            message: 'out dated token',
                            code: types_1.RESPONSE_CODES.UNAUTHORIZED
                        });
                    ctx.user = doc;
                    resolve();
                })
                    .catch(error => reject({
                    message: `${this.$get('name')}: Error finding user`,
                    original: error,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            });
        }
        activationEmail(ctx) {
            return new Promise((resolve, reject) => {
                let user = ctx.getResponseData() || ctx.user;
                if (!user)
                    return reject({
                        message: 'user not provided',
                        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                    });
                fs.readFile(authConfig.activationMailTemplatePath, (err, template) => {
                    if (err)
                        return reject({
                            message: 'error reading activation email template',
                            original: err,
                            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                        });
                    let token = jwt.sign({ id: user._id }, authConfig.tokenSecret);
                    let activationLink = util_1.stringUtil.cleanPath(`${state_1.State.config.host}/${state_1.State.config.services_prefix}/authentication/activateUser?${authConfig.tokenFieldName}=${token}`);
                    let emailOptions = {
                        from: authConfig.activationMailSubject,
                        to: user[authConfig.userEmailField],
                        subject: authConfig.activationMailSubject,
                        html: util_1.stringUtil.compile(template.toString('utf-8'), { username: user[authConfig.usernameField], activationLink })
                    };
                    this.transporter.sendMail(emailOptions, (sendEmailError, info) => {
                        if (sendEmailError)
                            return reject({
                                message: `error sending activation email`,
                                original: sendEmailError,
                                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                            });
                        this.$logger.info('Message %s sent: %s', info.messageId, info.response);
                        resolve();
                    });
                });
            });
        }
        sendActivationEmail() {
            return Promise.resolve({ data: true });
        }
        activateUser(ctx) {
            return new Promise((resolve, reject) => {
                let user = ctx.user;
                this.collection
                    .updateOne({ _id: new MongoDB.ObjectID(user._id) }, { $set: { [authConfig.userIsActiveField]: true } })
                    .then(doc => {
                    fs.readFile(authConfig.activationPage, 'utf-8', (err, data) => {
                        if (err)
                            reject({
                                message: '',
                                original: err,
                                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                            });
                        let message = 'Your account has been activated successfully';
                        let template = util_1.stringUtil.compile(data, { username: ctx.user.username, message: message });
                        resolve({ data: template, type: 'html' });
                    });
                })
                    .catch(error => reject({
                    message: 'error activating user account',
                    original: error,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            });
        }
        signin(userId, password, ctx) {
            return new Promise((resolve, reject) => {
                if (!userId && !userId.trim())
                    return reject({
                        message: 'username or email is required',
                        code: types_1.RESPONSE_CODES.BAD_REQUEST
                    });
                if (!password && !password.trim())
                    return reject({
                        message: 'password is required',
                        code: types_1.RESPONSE_CODES.BAD_REQUEST
                    });
                let query = {};
                if (Validall.Is.email(userId))
                    query[authConfig.userEmailField] = userId;
                else
                    query[authConfig.usernameField] = userId;
                this.collection
                    .findOne(query)
                    .then(doc => {
                    if (!doc || !Object.keys(doc).length)
                        return reject({
                            message: 'user is not found',
                            code: types_1.RESPONSE_CODES.UNAUTHORIZED
                        });
                    util_1.verify(password, doc[authConfig.passwordField], doc[authConfig.passwordSaltField])
                        .then((match) => {
                        if (match === true) {
                            ctx.useServiceHooks(this.$getService('findOne'));
                            resolve({ data: doc });
                        }
                        else {
                            reject({
                                message: 'wrong password',
                                code: types_1.RESPONSE_CODES.UNAUTHORIZED
                            });
                        }
                    })
                        .catch(error => reject({
                        message: 'error verifying password',
                        original: error,
                        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                    }));
                })
                    .catch(error => reject({
                    message: `[${this.$get('name')}] - findOne: unknown error`,
                    original: error,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                }));
            });
        }
        signup(documents, ctx) {
            return new Promise((resolve, reject) => {
                try {
                    let state = Validall(documents, {
                        [authConfig.usernameField]: { $type: 'string', $regex: util_1.toRegExp(authConfig.usernamePattern), $message: 'invalid username' },
                        [authConfig.userEmailField]: { $type: 'string', $is: 'email', $message: 'invalid email' },
                        [authConfig.passwordField]: { $required: true, $type: 'string', $regex: util_1.toRegExp(authConfig.passwordpattern), $message: 'invalid password' }
                    });
                    if (!state)
                        return reject({
                            message: Validall.error.message,
                            original: Validall.error,
                            code: types_1.RESPONSE_CODES.BAD_REQUEST
                        });
                }
                catch (e) {
                    console.trace(e);
                }
                util_1.hash(documents[authConfig.passwordField])
                    .then(results => {
                    if (results && results.length) {
                        documents[authConfig.passwordField] = results[0];
                        documents[authConfig.passwordSaltField] = results[1];
                        console.log(results);
                        ctx.useService(this, 'insert');
                    }
                    else {
                        reject({
                            message: 'Error hashing password',
                            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                        });
                    }
                })
                    .catch(error => {
                    reject({
                        message: 'Error hashing password',
                        original: error,
                        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                    });
                });
            });
        }
    };
    __decorate([
        decorators_1.HOOK()
    ], Authentication.prototype, "pushToken", null);
    __decorate([
        decorators_1.HOOK()
    ], Authentication.prototype, "secure", null);
    __decorate([
        decorators_1.HOOK({ private: true })
    ], Authentication.prototype, "activationEmail", null);
    __decorate([
        decorators_1.SERVICE({
            secure: true,
            after: ['authentication.activationEmail']
        })
    ], Authentication.prototype, "sendActivationEmail", null);
    __decorate([
        decorators_1.SERVICE({
            secure: true
        })
    ], Authentication.prototype, "activateUser", null);
    __decorate([
        decorators_1.SERVICE({
            args: ['body.userId', 'body.password'],
            method: 'post',
            after: ['Authentication.pushToken']
        })
    ], Authentication.prototype, "signin", null);
    __decorate([
        decorators_1.SERVICE({
            args: ['body.documents'],
            method: 'post',
            before: [`exists:@${modelName}:documents.email`, `exists:@${modelName}:documents.username`],
            after: ['Authentication.pushToken', 'Authentication.activationEmail']
        })
    ], Authentication.prototype, "signup", null);
    Authentication = __decorate([
        decorators_1.MODEL({
            name: modelName,
            accessable: false
        })
    ], Authentication);
    state_1.State.Models.push(Authentication);
}
exports.initAuthentication = initAuthentication;
//# sourceMappingURL=authentication.js.map