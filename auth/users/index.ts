import * as path from 'path';
import * as fs from 'fs';
import * as MongoDB from 'mongodb';
import * as jwt from 'jsonwebtoken';
import * as Validall from 'validall';
import { MODEL, HOOK, SERVICE } from "../../decorators";
import { MongoModel } from "../../models";
import { createTransport, createTestAccount, SendMailOptions } from "nodemailer";
import { State } from "../../state";
import { usersSchema, usersSchemaOptions } from "./schema";
import { hash, stringUtil, verify, toRegExp } from "../../util";
import { Context } from "../../context";
import { JsonWebTokenError } from 'jsonwebtoken';
import unique from '../../util/unique';
import { RESPONSE_CODES, IResponse, RESPONSE_DOMAINS } from '../../types';
import { App } from '../../app';

let tokenSecret = unique.Get();

@MODEL({
  secure: true,
  authorize: true,
  schema: usersSchema,
  schemaOptions: usersSchemaOptions,
  domain: RESPONSE_DOMAINS.SELF,
  after: ['filter:-password:passwordSalt']
})
export class Users extends MongoModel {
  transporter: any;

  constructor(app: App) {
    super(app);

    if (State.auth.transporter) {
      this.transporter = createTransport(State.auth.transporter);
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
      this.$logger.info('getting root user: ' + State.auth.rootUserEmail);
      this.collection.findOne({ username: State.auth.rootUserEmail })
        .then(doc => {
          resolve(doc);
        })
        .catch(error => reject(error));
    });
  }

  createRootUser(): Promise<any> {
    this.$logger.info('creating root user: ' + State.auth.rootUserEmail);
    return new Promise((resolve, reject) => {
      hash(State.auth.rootUserPassword)
        .then(results => {
          this.collection.insertOne({
            email: State.auth.rootUserEmail,
            password: results[0],
            passwordSalt: results[1],
            verified: true
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

      responseData.token = jwt.sign({ id: responseData._id }, tokenSecret);
      resolve();
    });
  }

  @HOOK()
  authenticate(ctx: Context): Promise<void> {
    return new Promise((resolve, reject) => {
      this.$logger.info(`authenticating user for ${ctx.service.__name} service...`);

      let token = ctx.getHeader('token') || ctx.query.token || ctx.body.token || ctx.cookies('token');

      if (!token) {
        return reject({
          message: 'user_token_is_missing',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      let data: any = jwt.verify(token, tokenSecret);

      if (!data || !data.id)
        return reject({
          message: 'invalid_user_token',
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      if (data.date)
        ctx.set('tokenDate', data.date);

      this.collection.findOne({ _id: new MongoDB.ObjectID(data.id) })
        .then(doc => {
          if (!doc || !Object.keys(doc).length)
            return reject({
              message: 'out_dated_token',
              code: RESPONSE_CODES.UNAUTHORIZED
            });

          ctx.user = doc;
          resolve();
        })
        .catch(error => reject({
          message: `${this.name}_error_finding_user`,
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @HOOK({ private: true })
  activationEmail(ctx: Context): Promise<void> {
    return new Promise((resolve, reject) => {

      let user = ctx.user || ctx.getResponseData();

      if (!user)
        return reject({
          message: 'user_not_provided',
          code: RESPONSE_CODES.UNKNOWN_ERROR
        });

      fs.readFile(path.join(__dirname, '../templates/activation-email-template.html'), (err, template) => {
        if (err)
          return reject({
            message: 'error_reading_activation_email_template',
            original: err,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          });

        let token = jwt.sign({ id: user._id, date: Date.now() }, tokenSecret);
        let activationLink = `http${State.config.secure ? 's' : ''}://`;
        activationLink += `${this.app}.${State.config.hostName}${State.env !== 'production' ? ':' + State.config.port : ''}/`;
        activationLink += stringUtil.cleanPath(`/${this.name}/activateUser?${token}=${token}`);

        let emailOptions: SendMailOptions = {
          from: `${State.config.server_name} Administration`,
          to: user.email,
          subject: `${State.config.server_name} Account Verification`,
          html: stringUtil.compile(template.toString('utf-8'), { username: 'User', activationLink })
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
    secure: false,
    authorize: false,
    args: ['body.email'],
    method: 'post',
    after: ['-filter', 'auth.users.activationEmail']
  })
  sendActivationEmail(email: string, ctx: Context): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ email: email })
        .then(doc => {
          if (doc) {
            ctx.user = doc;
            resolve({ data: true });
          } else {
            reject({
              message: 'email_not_found',
              code: RESPONSE_CODES.UNAUTHORIZED
            });
          }
        })
        .catch(err => reject(err));
    });
  }

  @SERVICE({
    secure: true,
    authorize: false,
    after: ['-filter']
  })
  activateUser(ctx: Context): Promise<IResponse> {
    return new Promise((resolve, reject) => {

      let user = ctx.user;
      let tokenDate = ctx.get('tokenDate');

      if (!tokenDate || ((Date.now() - tokenDate) > State.auth.verificationEmailExpiry)) {
        return reject({
          message: 'out_dated_token',
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      this.collection
        .updateOne({ _id: new MongoDB.ObjectID(user._id) }, { $set: { verified: true } })
        .then(doc => {
          fs.readFile(path.join(__dirname, '../templates/activation-page-template.html'), 'utf-8', (err, data) => {
            if (err)
              reject({
                message: '',
                original: err,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              });

            let message = 'Your account has been activated successfully';
            let template = stringUtil.compile(data, { email: ctx.user.email, message: message });
            resolve({ data: template, type: 'html' });
          });
        })
        .catch(error => reject({
          message: 'error_activating_account',
          original: error,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @SERVICE({
    secure: false,
    authorize: false,
    method: 'post',
    args: ['body.email'],
    after: ['-filter']
  })
  forgetPassword(email: string) {
    return new Promise((resolve, reject) => {

      if (!email)
        return reject({
          message: 'email_is_required',
          code: RESPONSE_CODES.BAD_REQUEST
        });

      if (!Validall.Is.email('email'))
        return reject({
          message: 'invalid_email',
          code: RESPONSE_CODES.BAD_REQUEST
        });

      this.collection.findOne({ email: email })
        .then(user => {
          if (!user)
            return reject({
              message: 'email_is_not_registered',
              code: RESPONSE_CODES.BAD_REQUEST
            });

          let newPassword = unique.Get();
          let hashedPassword;
          let passwordSalt;

          hash(newPassword)
            .then((result: [string, string]) => {
              let hashedPassword = result[0];
              let passwordSalt = result[1];

              this.collection.findOneAndUpdate({ _id: user._id }, {
                $set: {
                  password: hashedPassword,
                  passwordSalt: passwordSalt,
                }
              }, {
                  returnOriginal: false
                })
                .then(doc => {

                  fs.readFile(path.join(__dirname, '../templates/forget-password-email-template.html'), (err, template) => {
                    if (err)
                      return reject({
                        message: 'error reading forget password email template',
                        original: err,
                        code: RESPONSE_CODES.UNKNOWN_ERROR
                      });

                    let emailOptions: SendMailOptions = {
                      from: `${State.config.server_name} Administration`,
                      to: user.email,
                      subject: `${State.config.server_name} Reset Password`,
                      html: stringUtil.compile(template.toString('utf-8'), { email: user.email, password: newPassword })
                    };

                    this.transporter.sendMail(emailOptions, (sendEmailError: any, info: any) => {
                      if (sendEmailError)
                        return reject({
                          message: `error_sending_forget_password_email`,
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
    after: [`auth.users.pushToken`]
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
        query.email = email;
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

          verify(password, doc.password, doc.passwordSalt)
            .then((match: boolean) => {
              if (match === true) {
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
    after: [`auth.users.pushToken`, `auth.users.activationEmail`]
  })
  signup(document: any, ctx: Context): Promise<IResponse> {
    return new Promise((resolve, reject) => {

      try {
        let state = Validall(document, this.$get('schema'));

        if (!state)
          return reject({
            message: Validall.error.message,
            original: Validall.error,
            code: RESPONSE_CODES.BAD_REQUEST
          });

        this.collection.count({ email: document.email })
          .then(count => {
            if (count)
              return reject({
                message: 'document with same email already exists!',
                code: RESPONSE_CODES.BAD_REQUEST
              });

            hash(document.password)
              .then(results => {
                if (results && results.length) {
                  document.password = results[0];
                  document.passwordSalt = results[1];

                  this.insertOne(document)
                    .then(doc => {
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