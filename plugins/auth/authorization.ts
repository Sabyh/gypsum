import * as Validall from 'validall';
import * as MongoDB from 'mongodb';
import { Model, MongoModel } from '../../models';
import { Context } from '../../context';
import { MODEL, HOOK, SERVICE } from '../../decorators';
import { RESPONSE_CODES } from '../../types/index';
import { objectUtil } from '../../util/index';
import { State } from '../../state';
import { IResponse } from '../../types';
import { Logger } from '../../misc/logger';
import { IAuthenticationConfigOptions } from './config';

export namespace Authorization {
  export interface IAuthorizeOption {
    roles?: string | string[];
    groups?: string | string[];
    fields?: string | string[];
  }
}

export interface IPermission {
  model: string;
  services: string[];
}

export function initAuthorization(authConfig: IAuthenticationConfigOptions): any[] {
  Logger.Info('Initializing Authorization Layer...');

  /** 
   * Authorization
   * ====================================================================================================================================
  */
  @MODEL()
  class Authorization extends Model {
    roles: MongoDB.Collection;
    groups: MongoDB.Collection;

    constructor(appName: string) {
      super(appName);

      State.config.authorizationModelPath = appName + '.' + this.name;
    }

    private _mGetUserRolesFromGroups(id: string): Promise<string[]> {
      return new Promise((resolve, reject) => {
        this.groups.find({ users: { $in: [id] } })
          .toArray()
          .then(results => {
            if (results && results.length)
              resolve(results.reduce((prev, current) => {
                return prev.push(...current.roles);
              }, []));
            else
              resolve([]);
          });
      });
    }

    private _mGetUserPermissionsFromRules(id: string, extraRules: string[] = []): Promise<IPermission[]> {
      return new Promise((resolve, reject) => {
        this.roles.find({ $or: [{ users: { $in: [id] } }, { name: { $in: extraRules } }] })
          .toArray()
          .then(results => {
            if (results && results.length) {
              let permissions: any = [];
              results.forEach(result => {
                permissions.push(...result.permissions);
              }, []);

              resolve(permissions);
            } else
              resolve([]);
          });
      });
    }

    private _mFetchData(appName: string, modelName: string, options: { fetch: any, userFieldValue: string, match: string }, ctx: Context): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!options)
          return reject({
            message: 'invalid options',
            code: RESPONSE_CODES.BAD_REQUEST
          });

        let model: any = State.getModel(modelName, appName);

        if (!model)
          return reject({
            message: `model ${appName}.${modelName} not found`,
            code: RESPONSE_CODES.BAD_REQUEST
          });

        model.find(options.fetch.query, options.fetch.projections || {}, options.fetch.options)
          .then((res: any) => {
            if (!res || !res.data)
              return reject({
                message: 'document not found',
                code: RESPONSE_CODES.BAD_REQUEST
              });

            let docs = res.data;

            for (let i = 0; i < docs.length; i++) {
              let compareValue = objectUtil.getValue(docs[i], options.match);
              if (compareValue instanceof MongoDB.ObjectID)
                compareValue = compareValue.toString();

              if (options.userFieldValue !== compareValue)
                return reject({
                  message: 'user not authorized',
                  code: RESPONSE_CODES.UNAUTHORIZED
                });
            }

            ctx.set('fetchedData', docs);
            resolve();
          })
          .catch((err: any) => reject({
            message: err,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));

      });
    }

    @HOOK()
    authorize(options: { field: string, match: string, find: any } | boolean, ctx: Context): Promise<void> {
      return new Promise((resolve, reject) => {

        this.$logger.info(`authorizing ${ctx.service.__name} service...`);

        if (!ctx.user)
          return reject({
            message: 'user not logged in',
            code: RESPONSE_CODES.UNAUTHORIZED
          });

        let appName = ctx.appName.toLowerCase();
        let modelName = ctx.model.name.toLowerCase();
        let serviceName = ctx.service.name.toLowerCase();

        this.$logger.debug('getting user rules...');
        this._mGetUserRolesFromGroups(ctx.user._id)
          .then(roles => this._mGetUserPermissionsFromRules(ctx.user._id, roles))
          .then(permissions => {
            if (permissions.length) {
              for (let i = 0; i < permissions.length; i++) {
                if (
                  (permissions[i].model === '*' && permissions[i].services[0] === '*') ||
                  (permissions[i].model === '*' && permissions[i].services.indexOf(serviceName) > -1) ||
                  (permissions[i].model === modelName && permissions[i].services[0] === '*') ||
                  (permissions[i].model === modelName && permissions[i].services.indexOf(serviceName) > -1)
                ) {
                  return resolve();
                }
              }
            } else if (Validall.Types.object(options) && (<any>options).field && (<any>options).match) {

              let userFieldValue = objectUtil.getValue(ctx.user, (<any>options).field);

              if (!userFieldValue)
                return reject({
                  message: `${(<any>options).field} dose not exist in user object`,
                  code: RESPONSE_CODES.UNAUTHORIZED
                });

              if (userFieldValue instanceof MongoDB.ObjectID)
                userFieldValue = userFieldValue.toString();

              if (!(<any>options).fetch) {
                let matchValue = objectUtil.getValue(ctx, (<any>options).match);

                console.log(userFieldValue, matchValue);

                if (userFieldValue !== matchValue)
                  return reject({
                    message: 'user not authorized',
                    code: RESPONSE_CODES.UNAUTHORIZED
                  });

                return resolve();

              } else {
                let fetchObj: any = { query: {} };

                if (typeof (<any>options).fetch === 'string') {
                  fetchObj = objectUtil.getValue(ctx, (<any>options).fetch);

                } else {

                  if (typeof (<any>options).fetch.query === 'string')
                    fetchObj.query = objectUtil.getValue(ctx, (<any>options).fetch.query);

                  else
                    for (let prop in (<any>options).fetch.query)
                      if (typeof (<any>options).fetch.query[prop] === 'string' && (<any>options).fetch.query[prop].charAt(0) === '@')
                        fetchObj.query[prop] = objectUtil.getValue(ctx, (<any>options).fetch.query[prop].slice(1));

                  if (typeof (<any>options).fetch.projections === 'string')
                    fetchObj.projections = objectUtil.getValue(ctx, (<any>options).fetch.projections);

                  if (typeof (<any>options).fetch.options === 'string')
                    fetchObj.options = objectUtil.getValue(ctx, (<any>options).fetch.options);
                }

                if (fetchObj.query._id)
                  fetchObj.query._id = new MongoDB.ObjectID(fetchObj.query._id)

                return this._mFetchData(appName, modelName, { fetch: fetchObj, userFieldValue: userFieldValue, match: (<any>options).match }, ctx)
                  .then(() => resolve())
                  .catch(err => reject(err));
              }
            }

            reject({
              message: 'user not authorized',
              code: RESPONSE_CODES.UNAUTHORIZED
            });

          })
          .catch(error => reject({
            message: 'Error authorizing user',
            original: error,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          }));
      });
    }
  }


  /** 
   * Permissions
   * ====================================================================================================================================
  */
  @MODEL({
    secure: true,
    authorize: true
  })
  class Permissions extends Model {

    @SERVICE()
    find(): Promise<IResponse> {
      return new Promise((resolve, reject) => {

        let result: any = [];

        for (let j = 0; j < State.apps.length; j++) {
          if (State.apps[j].models && State.apps[j].models.length) {

            for (let i = 0; i < State.apps[i].models.length; i++) {
              let model = State.apps[i].models[i];
              let modelName = model.name;
              let record: { model: string; services: string[] } = { model: modelName, services: [] };
              let services = model.$getServices();

              if (Object.keys(services).length)
                for (let prop in services)
                  record.services.push(prop);

              result.push(record);
            }
          }
        }

        resolve({ data: result });
      });
    }
  }

  interface II {
    name: StringConstructor
  }

  var obj: II = { name: String }


  /** 
   * Roles
   * ====================================================================================================================================
  */
  @MODEL({
    secure: true,
    authorize: true,
    schema: {
      name: String,
      users: String,
      permissions: { model: 'string', services: 'string[]' }
    },
    schemaOptions: { required: true }
  })
  class AuthRoles extends MongoModel {

    private _mCreateRootRole(user: any): Promise<any> {
      this.$logger.info('creating default role');
      let role = {
        name: 'administrator',
        users: [user._id],
        permissions: [{ model: '*', services: ['*'] }]
      };

      return Promise.resolve(role);
    }

    private _mInsertRootRole(role: any) {
      this.$logger.info('inserting default role');
      this.collection.insertOne(role)
        .then(() => { })
        .catch(error => { throw 'Unable to create root user role: ' + error; });
    }

    onCollection() {
      let authenticationModel = <MongoModel>State.getModel(authConfig.usersModelConstructor.name, this.app);

      (<Authorization>State.getModel('authorization', this.app)).roles = this.collection;
      this.$logger.info('checking roles collection');
      this.collection.find({})
        .toArray()
        .then(docs => {
          if (!docs || !docs.length) {
            this.$logger.info('no roles found');
            (<any>authenticationModel).getRootUser()
              .then((user: any) => {
                if (user) {
                  this._mCreateRootRole(user)
                    .then((role: any) => this._mInsertRootRole(role))
                    .catch((error: any) => {
                      throw error;
                    });
                } else {
                  this.$logger.info('root user not found');
                  (<any>authenticationModel).createRootUser()
                    .then((user: any) => this._mCreateRootRole(user))
                    .then((role: any) => this._mInsertRootRole(role))
                    .catch((error: any) => {
                      throw error;
                    });
                }
              })
              .catch((error: any) => {
                throw error;
              });
          }
        })
        .catch(error => {
          this.$logger.error('error while initializing roles model:', error);
          throw error;
        });
    }


  }
  /** 
   * Roles
   * ====================================================================================================================================
  */
  @MODEL({
    secure: true,
    authorize: true,
    schema: {
      name: 'string',
      roles: 'string[]',
      users: 'string[]'
    },
    schemaOptions: { required: true }
  })
  class AuthGroups extends MongoModel {

    onCollection() {
      (<Authorization>State.getModel('Authorization', this.app)).groups = this.collection;
    }
  }

  return [Authorization, Permissions, AuthRoles, AuthGroups];
}
