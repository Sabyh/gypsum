import * as path from 'path';
import * as fs from 'fs';
import * as MongoDB from 'mongodb';
import * as jwt from 'jsonwebtoken';
import TB from 'tools-box';
import * as Validall from 'validall';
import { MODEL, HOOK, SERVICE } from "../../decorators";
import { MongoModel } from "../../models";
import { createTransport, createTestAccount, SendMailOptions } from "nodemailer";
import { State } from "../../state";
import { usersSchema } from "./schema";
import { Context } from "../../context";
import { RESPONSE_CODES, IResponse, RESPONSE_DOMAINS } from '../../types';
import { App } from '../../app';

@MODEL({
  secure: true,
  authorize: true,
  schema: usersSchema,
  servicesOptions: {
    FindById: { authorize: { field: '_id', match: '$params.id' } },
    UpdateById: { authorize: { field: '_id', match: '$params.id' } }
  },
  domain: RESPONSE_DOMAINS.SELF,
  after: ['filter:-password,passwordSalt,uuids'],
  indexes: [{ name: 'email', options: { unique: true } }]
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
      TB.hash(State.auth.rootUserPassword)
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

  getSockets(ids: string[] | MongoDB.ObjectID[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (ids && ids.length) {
        for (let i = 0; i < ids.length; i++)
          if (typeof ids[i] === "string")
            ids[i] = new MongoDB.ObjectID(ids[i]);

        this.collection.find({ _id: { $in: ids } })
          .project({ socket: 1 })
          .toArray()
          .then(res => resolve(res.map(entry => entry.socket).filter(entry => entry)))
          .catch(err => reject(err));
      } else {
        resolve([]);
      }
    });
  }

  @HOOK()
  pushToken(ctx: Context): Promise<void> {
    return new Promise((resolve, reject) => {
      let responseData = ctx.response.data;

      if (!responseData || Array.isArray(responseData) || !Validall.Types.object(responseData))
        return resolve();

      responseData.token = jwt.sign({ id: responseData._id, date: Date.now(), type: 'auth' }, State.auth.tokenSecret);
      resolve();
    });
  }

  @HOOK()
  pushNotification(ctx: Context, id: string) {

  }

  @HOOK()
  authenticate(ctx: Context): Promise<void> {
    return new Promise((resolve, reject) => {
      this.$logger.info(`authenticating user for ${ctx.service.__name} service...`);
      let token = ctx.getHeader('token') || ctx.body.token;

      if (!token) {
        return reject({
          message: `[${this.name}]: user token is missing`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      let data: any;

      try {
        data = jwt.verify(token, State.auth.tokenSecret);
      } catch (err) {
        return reject({
          message: `[${this.name}]: invalid user token`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      if (!data || !data.id)
        return reject({
          message: `[${this.name}]: invalid user token`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      if (data.type !== 'verifyEmail' && data.type !== 'auth') {
        return reject({
          message: `[${this.name}]: fake token`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      ctx.set('tokenData', data);

      let update: any = { $set: {} };

      this.collection.findOne({ _id: new MongoDB.ObjectID(data.id) })
        .then(doc => {
          if (!doc)
            return reject({
              message: `[${this.name}]: user no longer exists`,
              code: RESPONSE_CODES.UNAUTHORIZED
            });

          if (!doc.lastVisit || (Date.now() - doc.lastVisit) > State.auth.tokenExpiry)
            return reject({
              message: `[${this.name}]: outdated token`,
              code: RESPONSE_CODES.UNAUTHORIZED
            });

          this.collection.findOneAndUpdate({ _id: doc._id }, { $set: { lastVisit: Date.now(), socket: ctx._socket.id || doc.socket || null } }, { returnOriginal: false })
            .then((res) => {
              ctx.user = res.value;
              resolve();
            })
            .catch(err => reject({
              message: `[${this.name}]: error updating user auth`,
              original: err,
              code: RESPONSE_CODES.UNKNOWN_ERROR
            }));
        })
        .catch(err => reject({
          message: `[${this.name}]: error finding user`,
          original: err,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        }));
    });
  }

  @HOOK({ private: true })
  verificationEmail(ctx: Context): Promise<void> {
    return new Promise((resolve, reject) => {

      let user = ctx.user || ctx.response.data;

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

        let token = jwt.sign({ id: user._id, date: Date.now(), type: 'verifyEmail' }, State.auth.tokenSecret);
        let activationLink = `http${State.config.secure ? 's' : ''}://`;
        activationLink += `${this.app.name}.${State.config.hostName}${State.env !== 'production' ? ':' + State.config.port : ''}/`;
        activationLink += `${this.name}/activateUser?token=${token}`;

        this.$logger.info('activation link:', activationLink);

        let emailOptions: SendMailOptions = {
          from: State.auth.supportEmail || `${State.config.server_name} Administration`,
          to: user.email,
          subject: `${State.config.server_name} Account Verification`,
          html: TB.compile(template.toString('utf-8'), { username: user.email.split('@')[0], activationLink })
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
    after: ['-filter', 'auth.users.verificationEmail']
  })
  sendVerificationEmail(email: string, ctx: Context): Promise<IResponse> {
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
      let tokenData = ctx.get('tokenData');

      if (tokenData.type !== "verifyEmail") {
        return reject({
          message: `[${this.name}]: fake token`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      if (!tokenData.date || ((Date.now() - tokenData.date) > State.auth.verificationEmailExpiry)) {
        return reject({
          message: `[${this.name}]: out dated token`,
          code: RESPONSE_CODES.UNAUTHORIZED
        });
      }

      this.collection
        .updateOne({ _id: new MongoDB.ObjectID(user._id) }, { $set: { verified: true } })
        .then(doc => {
          fs.readFile(path.join(__dirname, '../templates/activation-page-template.html'), 'utf-8', (err, data) => {
            if (err)
              return reject({
                message: `[${this.name}]: error reading activation page`,
                original: err,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              });

            let message = 'Your account has been activated successfully';
            let template = TB.compile(data, { email: ctx.user.email.split('@')[0], message: message });
            resolve({ data: template, type: 'html' });
          });
        })
        .catch(error => reject({
          message: `[${this.name}]: error activating account`,
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

          let newPassword = TB.Unique.Get();
          let hashedPassword;
          let passwordSalt;

          TB.hash(newPassword)
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
                      from: State.auth.supportEmail || `${State.config.server_name} Administration`,
                      to: user.email,
                      subject: `${State.config.server_name} Reset Password`,
                      html: TB.compile(template.toString('utf-8'), { username: user.email.split('@')[0], password: newPassword })
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
    secure: true,
    authorize: false,
    args: ['body.token'],
    method: 'post',
    after: [`auth.users.pushToken`]
  })
  verifyToken(token: string, ctx?: Context) {
    return new Promise((resolve, reject) => {
      if (ctx.user)
        return resolve({ data: ctx.user })

      reject({
        message: 'invalid token',
        code: RESPONSE_CODES.UNAUTHORIZED
      });
    });
  }

  @SERVICE({
    secure: false,
    authorize: false,
    args: ['body.email', 'body.password', 'body.uuid'],
    method: 'post',
    after: [`auth.users.pushToken`]
  })
  signin(email: string, password: string, uuid: string, ctx: Context): Promise<IResponse> {
    return new Promise((resolve, reject) => {

      if (!email || !email.trim())
        return reject({
          message: 'email is required',
          code: RESPONSE_CODES.BAD_REQUEST
        });

      if (!password || !password.trim())
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

          TB.verify(password, doc.password, doc.passwordSalt)
            .then((match: boolean) => {
              if (match === true) {
                let update: any = { $set: { lastVisit: Date.now() } }
                if (uuid && doc.uuids.indexOf(uuid) === -1)
                  update.$push.uuids = uuid;

                this.updateById(doc._id, update)
                  .then(res => resolve(res));

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
    after: [`auth.users.pushToken`, `auth.users.verificationEmail`]
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

            TB.hash(document.password)
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

  @SERVICE({
    secure: true,
    authorize: false,
    args: ['body.uuid']
  })
  signout(uuid: string, ctx?: Context) {
    return new Promise((resolve, reject) => {

      if (uuid) {
        this.collection.updateOne({ _id: ctx.user._id }, {
          $pop: { uuids: uuid }
        })
          .then(res => {
            resolve({ data: true })
          })
          .catch(err => {
            this.$logger.error('error signing user out:')
            this.$logger.error(err);
            reject({
              message: 'error signing user out',
              original: err,
              code: RESPONSE_CODES.UNKNOWN_ERROR
            });
          });

      } else {
        resolve(true);
      }
    })
  }
}