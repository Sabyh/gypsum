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
const state_1 = require("../state");
const models_1 = require("../models");
const types_1 = require("../types");
const decorators_1 = require("../decorators");
const util_1 = require("../util");
let Authentication = class Authentication extends models_1.Model {
    constructor() {
        super();
        if (state_1.State.config.usersModel) {
            this.userModel = state_1.State.getModel(state_1.State.config.usersModel);
            if (!this.userModel)
                throw `'${state_1.State.config.usersModel}' not found!`;
            if (!this.userModel.$get('accessable'))
                throw `'${state_1.State.config.usersModel}' must be public!`;
            if (state_1.State.config.tranporterOptions) {
                this.transporter = nodemailer_1.createTransport(state_1.State.config.tranporterOptions);
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
    }
    getRootUser() {
        return new Promise((resolve, reject) => {
            this.$logger.info('getting root user: ' + state_1.State.config.rootUser);
            this.userModel.collection.findOne({ username: state_1.State.config.rootUser })
                .then(doc => {
                resolve(doc);
            })
                .catch(error => reject(error));
        });
    }
    createRootUser() {
        this.$logger.info('creating root user: ' + state_1.State.config.rootUser);
        return new Promise((resolve, reject) => {
            util_1.hash(state_1.State.config.rootPassword)
                .then(results => {
                this.userModel.collection.insertOne({
                    [state_1.State.config.usernameField]: state_1.State.config.rootUser,
                    [state_1.State.config.userEmailField]: state_1.State.config.rootUserEmail,
                    [state_1.State.config.passwordField]: results[0],
                    [state_1.State.config.passwordSaltField]: results[1]
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
        let responseData = ctx.getResponseData();
        console.log('pushToken', responseData);
        if (!responseData || Array.isArray(responseData) || !Validall.Types.object(responseData))
            return ctx.next();
        responseData[state_1.State.config.tokenFieldName] = jwt.sign({ id: responseData._id }, state_1.State.config.tokenSecret);
        ctx.next();
    }
    secure(ctx) {
        let token = ctx.getHeader(state_1.State.config.tokenFieldName) || ctx.query[state_1.State.config.tokenFieldName] || ctx.cookies(state_1.State.config.tokenFieldName) || ctx.body[state_1.State.config.tokenFieldName];
        if (!token)
            return ctx.next({
                message: 'user token is missing',
                code: types_1.RESPONSE_CODES.UNAUTHORIZED
            });
        let data = jwt.verify(token, state_1.State.config.tokenSecret);
        if (!data.id)
            return ctx.next({
                message: 'invalid user token',
                code: types_1.RESPONSE_CODES.UNAUTHORIZED
            });
        this.userModel.collection.findOne({ _id: new MongoDB.ObjectID(data.id) })
            .then(doc => {
            if (!doc || !Object.keys(doc).length)
                return ctx.next({
                    message: 'out dated token',
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
            ctx.user = doc;
            ctx.next();
        })
            .catch(error => ctx.next({
            message: `${this.$get('name')}: Error finding user`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    activationEmail(ctx) {
        let user = ctx.getResponseData() || ctx.user;
        if (!user)
            return ctx.next({
                message: 'user not provided',
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            });
        fs.readFile(state_1.State.config.activationMailTemplatePath, (err, template) => {
            if (err)
                return ctx.next({
                    message: 'error reading activation email template',
                    original: err,
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                });
            let token = jwt.sign({ id: user._id }, state_1.State.config.tokenSecret);
            let activationLink = util_1.stringUtil.cleanPath(`${state_1.State.config.host}/${state_1.State.config.services_prefix}/authentication/activateUser?${state_1.State.config.tokenFieldName}=${token}`);
            let emailOptions = {
                from: state_1.State.config.activationMailSubject,
                to: user[state_1.State.config.userEmailField],
                subject: state_1.State.config.activationMailSubject,
                html: util_1.stringUtil.compile(template.toString('utf-8'), { username: user[state_1.State.config.usernameField], activationLink })
            };
            this.transporter.sendMail(emailOptions, (sendEmailError, info) => {
                if (sendEmailError)
                    return ctx.next({
                        message: `error sending activation email`,
                        original: sendEmailError,
                        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                    });
                this.$logger.info('Message %s sent: %s', info.messageId, info.response);
                ctx.next();
            });
        });
    }
    sendActivationEmail(ctx) {
        ctx.ok(true);
    }
    activateUser(ctx) {
        let user = ctx.user;
        this.userModel.collection
            .updateOne({ _id: new MongoDB.ObjectID(user._id) }, { $set: { [state_1.State.config.userIsActiveField]: true } })
            .then(doc => {
            fs.readFile(state_1.State.config.activationPage, 'utf-8', (err, data) => {
                if (err)
                    ctx.next({
                        message: '',
                        original: err,
                        code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                    });
                let message = 'Your account has been activated successfully';
                let template = util_1.stringUtil.compile(data, { username: ctx.user.username, message: message });
                ctx.sendHtml(template);
            });
        })
            .catch(error => ctx.next({
            message: 'error activating user account',
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    signin(ctx) {
        let userId = ctx.body.userId;
        let password = ctx.body.password;
        if (!userId && !userId.trim())
            return ctx.next({
                message: 'username or email is required',
                code: types_1.RESPONSE_CODES.BAD_REQUEST
            });
        if (!password && !password.trim())
            return ctx.next({
                message: 'password is required',
                code: types_1.RESPONSE_CODES.BAD_REQUEST
            });
        let query = {};
        if (Validall.Is.email(userId))
            query[state_1.State.config.userEmailField] = userId;
        else
            query[state_1.State.config.usernameField] = userId;
        this.userModel.collection
            .findOne(query)
            .then(doc => {
            if (!doc || !Object.keys(doc).length)
                return ctx.next({
                    message: 'user is not found',
                    code: types_1.RESPONSE_CODES.UNAUTHORIZED
                });
            util_1.verify(password, doc[state_1.State.config.passwordField], doc[state_1.State.config.passwordSaltField])
                .then((match) => {
                if (match === true) {
                    ctx.useServiceHooks(this.userModel.$getService('findOne'));
                    ctx.ok(doc);
                }
                else {
                    ctx.next({
                        message: 'wrong password',
                        code: types_1.RESPONSE_CODES.UNAUTHORIZED
                    });
                }
            })
                .catch(error => ctx.next({
                message: 'error verifying password',
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
            }));
        })
            .catch(error => ctx.next({
            message: `[${this.userModel.$get('name')}] - findOne: unknown error`,
            original: error,
            code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
        }));
    }
    signup(ctx) {
        try {
            let state = Validall(ctx.body.documents, {
                [state_1.State.config.usernameField]: { $type: 'string', $regex: util_1.toRegExp(state_1.State.config.usernamePattern), $message: 'invalid username' },
                [state_1.State.config.userEmailField]: { $type: 'string', $is: 'email', $message: 'invalid email' },
                [state_1.State.config.passwordField]: { $required: true, $type: 'string', $regex: util_1.toRegExp(state_1.State.config.passwordpattern), $message: 'invalid password' }
            });
            if (!state)
                return ctx.next({
                    message: Validall.error.message,
                    original: Validall.error,
                    code: types_1.RESPONSE_CODES.BAD_REQUEST
                });
        }
        catch (e) {
            console.trace(e);
        }
        util_1.hash(ctx.body.documents[state_1.State.config.passwordField])
            .then(results => {
            if (results && results.length) {
                ctx.body.documents[state_1.State.config.passwordField] = results[0];
                ctx.body.documents[state_1.State.config.passwordSaltField] = results[1];
                console.log(results);
                ctx.useService(this.userModel, 'insert');
            }
            else {
                ctx.next({
                    message: 'Error hashing password',
                    code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
                });
            }
        })
            .catch(error => {
            ctx.next({
                message: 'Error hashing password',
                original: error,
                code: types_1.RESPONSE_CODES.UNKNOWN_ERROR
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
        method: 'post',
        after: ['Authentication.pushToken']
    })
], Authentication.prototype, "signin", null);
__decorate([
    decorators_1.SERVICE({
        method: 'post',
        before: [`exists:@${state_1.State.config.usersModel}:documents.email`, `exists:@${state_1.State.config.usersModel}:documents.username`],
        after: ['Authentication.pushToken', 'Authentication.activationEmail']
    })
], Authentication.prototype, "signup", null);
Authentication = __decorate([
    decorators_1.MODEL({
        accessable: false
    })
], Authentication);
exports.Authentication = Authentication;
//# sourceMappingURL=main.js.map