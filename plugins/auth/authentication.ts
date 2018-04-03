import * as path from 'path';
import * as fs from 'fs';
import * as MongoDB from 'mongodb';
import * as Validall from 'validall';
import * as jwt from 'jsonwebtoken';
import { createTransport, SendMailOptions, createTestAccount } from 'nodemailer';
import { State } from '../../state';
import { Model, MongoModel } from '../../models';
import { Context } from '../../context';
import { RESPONSE_CODES, API_TYPES, IResponse } from '../../types';
import { SERVICE, MODEL, HOOK, IModelOptions } from '../../decorators';
import { toRegExp, verify, hash, stringUtil, random } from '../../util';
import { IAuthenticationConfig, IEmailTransporter, IAuthenticationConfigOptions } from './config';
export type getOptions = keyof IModelOptions;

export class Authentication { };

export function initAuthentication(authConfig: IAuthenticationConfigOptions, transporterOptions?: IEmailTransporter): any {

  let UserConstructor: typeof MongoModel = authConfig.usersModelConstructor || MongoModel;
  let modelName = UserConstructor.name.toLowerCase();

  @MODEL()
  class Authentication extends UserConstructor {
    transporter: any;

    constructor(appName: string) {
      super(appName);

      this.name = modelName;
      State.config.authenticationModelPath = appName + '.' + this.name;

      if (transporterOptions) {
        this.transporter = createTransport(transporterOptions);

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

    getRootUser(): Promise<any> {
      return new Promise((resolve, reject) => {
        this.$logger.info('getting root user: ' + authConfig.rootUser);
        this.collection.findOne({ username: authConfig.rootUser })
          .then(doc => {
            resolve(doc);
          })
          .catch(error => reject(error));
      });
    }

    createRootUser(): Promise<any> {
      this.$logger.info('creating root user: ' + authConfig.rootUser);
      return new Promise((resolve, reject) => {
        hash(authConfig.rootUserPassword)
          .then(results => {
            this.collection.insertOne({
              [authConfig.usernameField]: authConfig.rootUser,
              [authConfig.userEmailField]: authConfig.rootUserEmail,
              [authConfig.passwordField]: results[0],
              [authConfig.passwordSaltField]: results[1],
              [authConfig.userVerifiedField]: true
            })
              .then(res => {
                if (res && res.ops.length)
                  resolve(res.ops[0])
                else
                  reject('unable to create root user');
              })
              .catch(error => reject(error));
          })
          .catch(error => reject(error));
      });
    }

    @HOOK()
    pushToken(ctx: Context): Promise<void> {
      return new Promise((resolve, reject) => {
        let responseData = ctx.getResponseData();

        if (!responseData || Array.isArray(responseData) || !Validall.Types.object(responseData))
          return resolve();

        responseData[authConfig.tokenFieldName] = jwt.sign({ id: responseData._id }, authConfig.tokenSecret);
        resolve();
      });
    }

    @HOOK()
    secure(ctx: Context): Promise<void> {
      return new Promise((resolve, reject) => {
        this.$logger.info(`authenticating user for ${ctx.service.__name} service...`);

        let token = ctx.getHeader(authConfig.tokenFieldName) || ctx.query[authConfig.tokenFieldName] || ctx.cookies(authConfig.tokenFieldName) || ctx.body[authConfig.tokenFieldName];

        if (!token) {
          return reject({
            message: 'user token is missing',
            code: RESPONSE_CODES.UNAUTHORIZED
          });
        }

        let data: any = jwt.verify(token, authConfig.tokenSecret);

        if (!data.id)
          return reject({
            message: 'invalid user token',
            code: RESPONSE_CODES.UNAUTHORIZED
          });

        this.collection.findOne({ _id: new MongoDB.ObjectID(data.id) })
          .then(doc => {
            if (!doc || !Object.keys(doc).length)
              return reject({
                message: 'out dated token',
                code: RESPONSE_CODES.UNAUTHORIZED
              });

            ctx.user = doc;
            resolve();
          })
          .catch(error => reject({
            message: `${this.name}: Error finding user`,
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      });
    }

    @HOOK({ private: true })
    activationEmail(ctx: Context): Promise<void> {
      return new Promise((resolve, reject) => {

        let user = ctx.getResponseData() || ctx.user;

        if (!user)
          return reject({
            message: 'user not provided',
            code: RESPONSE_CODES.UNKNOWN_ERROR
          });

        fs.readFile(authConfig.activationMailTemplatePath, (err, template) => {
          if (err)
            return reject({
              message: 'error reading activation email template',
              original: err,
              code: RESPONSE_CODES.UNKNOWN_ERROR
            });

          let token = jwt.sign({ id: user._id }, authConfig.tokenSecret);
          let activationLink = `http${State.config.secure ? 's' : ''}://`;
          activationLink += `${this.app}.${State.config.hostName}${State.env !== 'production' ? ':' + State.config.port : ''}/`;
          activationLink += stringUtil.cleanPath(`/${this.name}/activateUser?${authConfig.tokenFieldName}=${token}`);

          console.log(activationLink);

          let emailOptions: SendMailOptions = {
            from: authConfig.activationMailSubject,
            to: user[authConfig.userEmailField],
            subject: authConfig.activationMailSubject,
            html: stringUtil.compile(template.toString('utf-8'), { username: user[authConfig.usernameField], activationLink })
          };

          this.transporter.sendMail(emailOptions, (sendEmailError: any, info: any) => {
            if (sendEmailError)
              return reject({
                message: `error sending activation email`,
                original: sendEmailError,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              });

            this.$logger.info('Message %s sent: %s', info.messageId, info.response);
            resolve();
          });
        });
      });
    }

    @SERVICE({
      secure: true,
      after: [`api.${modelName}.activationEmail`]
    })
    sendActivationEmail(): Promise<IResponse> {
      return Promise.resolve({ data: true });
    }

    @SERVICE({
      secure: true
    })
    activateUser(ctx: Context): Promise<IResponse> {
      return new Promise((resolve, reject) => {

        let user = ctx.user;

        this.collection
          .updateOne({ _id: new MongoDB.ObjectID(user._id) }, { $set: { [authConfig.userVerifiedField]: true } })
          .then(doc => {
            fs.readFile(authConfig.activationPage, 'utf-8', (err, data) => {
              if (err)
                reject({
                  message: '',
                  original: err,
                  code: RESPONSE_CODES.UNKNOWN_ERROR
                });

              let message = 'Your account has been activated successfully';
              let template = stringUtil.compile(data, { username: ctx.user.username, message: message });
              resolve({ data: template, type: 'html' });
            });
          })
          .catch(error => reject({
            message: 'error activating user account',
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      });
    }

    @SERVICE({
      secure: false,
      authorize: false,
      args: ['body.email']
    })
    forgetPassword(email: string) {
      return new Promise((resolve, reject) => {

        if (!email)
          return reject({
            message: 'email is required',
            code: RESPONSE_CODES.BAD_REQUEST
          });

        if (!Validall.Is.email('email'))
          return reject({
            message: 'invalid email',
            code: RESPONSE_CODES.BAD_REQUEST
          });

        this.collection.findOne({ email: email })
          .then(user => {
            if (!user)
              return reject({
                message: 'email is not registered',
                code: RESPONSE_CODES.BAD_REQUEST
              });

            let newPassword = random(19);
            let hashedPassword;
            let passwordSalt;

            hash(newPassword)
              .then((result: [string, string]) => {
                let hashedPassword = result[0];
                let passwordSalt = result[1];

                this.collection.findOneAndUpdate({ _id: user._id }, {
                  $set: {
                    [authConfig.passwordField]: hashedPassword,
                    [authConfig.passwordSaltField]: passwordSalt,
                  }
                }, {
                    returnOriginal: false
                  })
                  .then(doc => {

                    fs.readFile(authConfig.forgetPasswordMailTemplatePath, (err, template) => {
                      if (err)
                        return reject({
                          message: 'error reading forget password email template',
                          original: err,
                          code: RESPONSE_CODES.UNKNOWN_ERROR
                        });

                      let emailOptions: SendMailOptions = {
                        from: authConfig.activationMailSubject,
                        to: user[authConfig.userEmailField],
                        subject: authConfig.activationMailSubject,
                        html: stringUtil.compile(template.toString('utf-8'), { username: user[authConfig.usernameField], password: newPassword })
                      };

                      this.transporter.sendMail(emailOptions, (sendEmailError: any, info: any) => {
                        if (sendEmailError)
                          return reject({
                            message: `error sending forget password email`,
                            original: sendEmailError,
                            code: RESPONSE_CODES.UNKNOWN_ERROR
                          });

                        this.$logger.info('Message %s sent: %s', info.messageId, info.response);
                        resolve(true);
                      });
                    });
                  })
                  .catch(err => reject({
                    message: 'error updaring user password',
                    original: err,
                    code: RESPONSE_CODES.UNKNOWN_ERROR
                  }));
              })
              .catch(err => reject({
                message: 'error hashing new password',
                original: err,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              }));
          })
          .catch(err => reject({
            message: 'error finding user',
            original: err,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      });
    }

    @SERVICE({
      secure: false,
      authorize: false,
      args: ['body.email', 'body.password'],
      method: 'post',
      after: [`api.${modelName}.pushToken`]
    })
    signin(email: string, password: string, ctx: Context): Promise<IResponse> {
      return new Promise((resolve, reject) => {

        if (!email && !email.trim())
          return reject({
            message: 'email is required',
            code: RESPONSE_CODES.BAD_REQUEST
          });

        if (!password && !password.trim())
          return reject({
            message: 'password is required',
            code: RESPONSE_CODES.BAD_REQUEST
          });

        let query: any = {};

        if (Validall.Is.email(email))
          query[authConfig.userEmailField] = email;
        else
          return reject({
            message: 'invalid email',
            code: RESPONSE_CODES.BAD_REQUEST
          });

        this.collection
          .findOne(query)
          .then(doc => {
            if (!doc || !Object.keys(doc).length)
              return reject({
                message: 'user is not found',
                code: RESPONSE_CODES.UNAUTHORIZED
              });

            verify(password, doc[authConfig.passwordField], doc[authConfig.passwordSaltField])
              .then((match: boolean) => {
                if (match === true) {
                  ctx.useServiceHooks(this.$getService('findOne'));
                  resolve({ data: doc });
                } else {
                  reject({
                    message: 'wrong password',
                    code: RESPONSE_CODES.UNAUTHORIZED
                  });
                }
              })
              .catch(error => reject({
                message: 'error verifying password',
                original: error,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              }));
          })
          .catch(error => reject({
            message: `[${this.name}] - findOne: unknown error`,
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      });
    }

    @SERVICE({
      secure: false,
      authorize: false,
      args: ['body.document'],
      method: 'post',
      after: [`api.${modelName}.pushToken`, `api.${modelName}.activationEmail`]
    })
    signup(document: any, ctx: Context): Promise<IResponse> {
      return new Promise((resolve, reject) => {

        try {
          let state = Validall(document, {
            [authConfig.userEmailField]: { $type: 'string', $is: 'email', $message: 'invalid email' },
            [authConfig.passwordField]: { $required: true, $type: 'string', $regex: toRegExp(authConfig.passwordpattern), $message: 'invalid password' }
          });

          if (!state)
            return reject({
              message: Validall.error.message,
              original: Validall.error,
              code: RESPONSE_CODES.BAD_REQUEST
            });

          this.collection.count({ email: document[authConfig.userEmailField] })
            .then(count => {
              if (count)
                return reject({
                  message: 'document with same email already exists!',
                  code: RESPONSE_CODES.BAD_REQUEST
                });

              hash(document[authConfig.passwordField])
                .then(results => {
                  if (results && results.length) {
                    document[authConfig.passwordField] = results[0];
                    document[authConfig.passwordSaltField] = results[1];

                    this.insertOne(document)
                      .then(doc => {
                        ctx.useServiceHooks(this.$getService('insertOne'));
                        resolve(doc);
                      })
                      .catch(error => reject(error));

                  } else {
                    reject({
                      message: 'Error hashing password',
                      code: RESPONSE_CODES.UNKNOWN_ERROR
                    })
                  }
                })
                .catch(error => {
                  reject({
                    message: 'Error hashing password',
                    original: error,
                    code: RESPONSE_CODES.UNKNOWN_ERROR
                  });
                });

            })
            .catch(err => reject({
              message: 'error checking email existance!',
              original: err,
              code: RESPONSE_CODES.BAD_REQUEST
            }));

        } catch (e) {
          console.trace(e);
        }

      });
    }
  }

  return Authentication;
}



