import * as path from 'path';
import * as fs from 'fs';
import * as MongoDB from 'mongodb';
import * as Validall from 'validall';
import * as jwt from 'jsonwebtoken';
import { createTransport, SendMailOptions, createTestAccount } from 'nodemailer';
import { State } from '../state';
import { Model, MongoModel } from '../models';
import { Context } from '../context';
import { RESPONSE_CODES } from '../types';
import { SERVICE, MODEL, HOOK } from '../decorators';
import { toRegExp, verify, hash, stringUtil } from '../util';

@MODEL({
  accessable: false
})
export class Authentication extends Model {
  userModel: MongoModel;
  transporter: any;

  constructor() {
    super();

    if (State.config.usersModel) {
      this.userModel = <MongoModel>State.getModel(State.config.usersModel);

      if (!this.userModel)
        throw `'${State.config.usersModel}' not found!`;

      if (!this.userModel.$get('accessable'))
        throw `'${State.config.usersModel}' must be public!`;

      if (State.config.tranporterOptions) {
        this.transporter = createTransport(State.config.tranporterOptions);

        // creating nodemailer test account
      } else {
        createTestAccount((err, account) => {
          if (err)
            throw err;

          this.transporter = createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
              user: account.user, // generated ethereal user
              pass: account.pass  // generated ethereal password
            }
          });
        });
      }
    }
  }

  getRootUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.$logger.info('getting root user: ' + State.config.rootUser);
      this.userModel.collection.findOne({ username: State.config.rootUser })
        .then(doc => {
          resolve(doc);
        })
        .catch(error => reject(error));
    });
  }

  createRootUser(): Promise<any> {
    this.$logger.info('creating root user: ' + State.config.rootUser);
    return new Promise((resolve, reject) => {
      hash(State.config.rootPassword)
        .then(results => {
          this.userModel.collection.insertOne({
            [State.config.usernameField]: State.config.rootUser,
            [State.config.userEmailField]: State.config.rootUserEmail,
            [State.config.passwordField]: results[0],
            [State.config.passwordSaltField]: results[1]
          })
            .then(doc => {
              if (doc)
                resolve(doc)
              else
                reject('unable to create root user');
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  @HOOK()
  pushToken(ctx: Context) {
    let responseData = ctx.getResponseData();
    console.log('pushToken', responseData);

    if (!responseData || Array.isArray(responseData) || !Validall.Types.object(responseData))
      return ctx.next();

    responseData[State.config.tokenFieldName] = jwt.sign({ id: responseData._id }, State.config.tokenSecret);
    ctx.next();
  }

  @HOOK()
  secure(ctx: Context) {
    let token = ctx.getHeader(State.config.tokenFieldName) || ctx.query[State.config.tokenFieldName] || ctx.cookies(State.config.tokenFieldName) || ctx.body[State.config.tokenFieldName];

    if (!token)
      return ctx.next({
        message: 'user token is missing',
        code: RESPONSE_CODES.UNAUTHORIZED
      });

    let data: any = jwt.verify(token, State.config.tokenSecret);

    if (!data.id)
      return ctx.next({
        message: 'invalid user token',
        code: RESPONSE_CODES.UNAUTHORIZED
      });

    this.userModel.collection.findOne({ _id: new MongoDB.ObjectID(data.id) })
      .then(doc => {
        if (!doc || !Object.keys(doc).length)
          return ctx.next({
            message: 'out dated token',
            code: RESPONSE_CODES.UNAUTHORIZED
          });

        ctx.user = doc;
        ctx.next();
      })
      .catch(error => ctx.next({
        message: `${this.$get('name')}: Error finding user`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @HOOK({ private: true })
  activationEmail(ctx: Context) {
    let user = ctx.getResponseData() || ctx.user;

    if (!user)
      return ctx.next({
        message: 'user not provided',
        code: RESPONSE_CODES.UNKNOWN_ERROR
      });

    fs.readFile(State.config.activationMailTemplatePath, (err, template) => {
      if (err)
        return ctx.next({
          message: 'error reading activation email template',
          original: err,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        });

      let token = jwt.sign({ id: user._id }, State.config.tokenSecret);
      let activationLink = stringUtil.cleanPath(`${State.config.host}/${State.config.services_prefix}/authentication/activateUser?${State.config.tokenFieldName}=${token}`);

      let emailOptions: SendMailOptions = {
        from: State.config.activationMailSubject,
        to: user[State.config.userEmailField],
        subject: State.config.activationMailSubject,
        html: stringUtil.compile(template.toString('utf-8'), { username: user[State.config.usernameField], activationLink })
      };

      this.transporter.sendMail(emailOptions, (sendEmailError: any, info: any) => {
        if (sendEmailError)
          return ctx.next({
            message: `error sending activation email`,
            original: sendEmailError,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          });

        this.$logger.info('Message %s sent: %s', info.messageId, info.response);
        ctx.next();
      })
    });
  }

  @SERVICE({
    secure: true,
    after: ['authentication.activationEmail']
  })
  sendActivationEmail(ctx: Context) {
    ctx.ok(true);
  }

  @SERVICE({
    secure: true
  })
  activateUser(ctx: Context) {
    let user = ctx.user;

    this.userModel.collection
      .updateOne({ _id: new MongoDB.ObjectID(user._id) }, { $set: { [State.config.userIsActiveField]: true } })
      .then(doc => {
        fs.readFile(State.config.activationPage, 'utf-8', (err, data) => {
          if (err)
            ctx.next({
              message: '',
              original: err,
              code: RESPONSE_CODES.UNKNOWN_ERROR
            });

          let message = 'Your account has been activated successfully';
          let template = stringUtil.compile(data, { username: ctx.user.username, message: message });
          ctx.sendHtml(template);
        });
      })
      .catch(error => ctx.next({
        message: 'error activating user account',
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE({
    method: 'post',
    after: ['Authentication.pushToken']
  })
  signin(ctx: Context) {
    let userId = ctx.body.userId;
    let password = ctx.body.password;

    if (!userId && !userId.trim())
      return ctx.next({
        message: 'username or email is required',
        code: RESPONSE_CODES.BAD_REQUEST
      });

    if (!password && !password.trim())
      return ctx.next({
        message: 'password is required',
        code: RESPONSE_CODES.BAD_REQUEST
      });

    let query: any = {};

    if (Validall.Is.email(userId))
      query[State.config.userEmailField] = userId;
    else
      query[State.config.usernameField] = userId;

    this.userModel.collection
      .findOne(query)
      .then(doc => {
        if (!doc || !Object.keys(doc).length)
          return ctx.next({
            message: 'user is not found',
            code: RESPONSE_CODES.UNAUTHORIZED
          });

        verify(password, doc[State.config.passwordField], doc[State.config.passwordSaltField])
          .then((match: boolean) => {
            if (match === true) {
              ctx.useServiceHooks(this.userModel.$getService('findOne'));
              ctx.ok(doc);
            } else {
              ctx.next({
                message: 'wrong password',
                code: RESPONSE_CODES.UNAUTHORIZED
              });
            }
          })
          .catch(error => ctx.next({
            message: 'error verifying password',
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      })
      .catch(error => ctx.next({
        message: `[${this.userModel.$get('name')}] - findOne: unknown error`,
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }

  @SERVICE({
    method: 'post',
    before: [`exists:@${State.config.usersModel}:documents.email`, `exists:@${State.config.usersModel}:documents.username`],
    after: ['Authentication.pushToken', 'Authentication.activationEmail']
  })
  signup(ctx: Context) {
    try {
      let state = Validall(ctx.body.documents, {
        [State.config.usernameField]: { $type: 'string', $regex: toRegExp(State.config.usernamePattern), $message: 'invalid username' },
        [State.config.userEmailField]: { $type: 'string', $is: 'email', $message: 'invalid email' },
        [State.config.passwordField]: { $required: true, $type: 'string', $regex: toRegExp(State.config.passwordpattern), $message: 'invalid password' }
      });

      if (!state)
        return ctx.next({
          message: Validall.error.message,
          original: Validall.error,
          code: RESPONSE_CODES.BAD_REQUEST
        });
    } catch (e) {
      console.trace(e);
    }

    hash(ctx.body.documents[State.config.passwordField])
      .then(results => {
        if (results && results.length) {
          ctx.body.documents[State.config.passwordField] = results[0];
          ctx.body.documents[State.config.passwordSaltField] = results[1];
          console.log(results);
          ctx.useService(this.userModel, 'insert');
        } else {
          ctx.next({
            message: 'Error hashing password',
            code: RESPONSE_CODES.UNKNOWN_ERROR
          })
        }
      })
      .catch(error => {
        ctx.next({
          message: 'Error hashing password',
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        });
      });
  }
}


