import { Collection } from 'mongodb';
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

export function initAuthorization(authConfig: IAuthenticationConfigOptions) {
  Logger.Info('Initializing Authorization Layer...');

  State.config.authorizationModelName = 'Authorization';

  /** 
   * Authorization
   * ====================================================================================================================================
  */
  @MODEL()
  class Authorization extends Model {
    roles: Collection;
    groups: Collection;

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

    @HOOK()
    authorize(options: boolean | string[], ctx: Context): Promise<void> {
      return new Promise((resolve, reject) => {

        if (!ctx.user)
          return reject({
            message: 'user not logged in',
            code: RESPONSE_CODES.UNAUTHORIZED
          });

        let modelName = ctx.model.$get('name').toLowerCase();
        let serviceName = ctx.service.name.toLowerCase();

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
            }

            if (options !== true && Array.isArray(options)) {
              for (let i = 0; i < (<string[]>options).length; i++) {
                let option: string = (<string[]>options)[i];
                let parts = option.split(':');
                let userField: string = <string>parts.shift();
                let contextPathArr = parts[0].split('.');
                let contextField: string | undefined = contextPathArr.shift();
                let contextSubField: string = contextPathArr.join('.');

                if (!userField || !contextField || !contextSubField || ['query', 'body', 'params'].indexOf(contextField) === -1)
                  return reject({
                    message: `${Authorization}: bad options provided: ${options}`,
                    code: RESPONSE_CODES.BAD_REQUEST
                  });

                let val01 = objectUtil.getValue(ctx.user, <string>userField);
                let val02 = objectUtil.getValue((<any>ctx)[contextField], contextSubField);

                if (userField === '_id')
                  val01 = val01.toString();

                if (val01 !== val02)
                  return reject({
                    message: 'user not authorized',
                    code: RESPONSE_CODES.UNAUTHORIZED
                  });
              }

              return resolve();
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

        let models = State.models;
        let result: any = [];

        for (let i = 0; i < models.length; i++) {
          let modelName = models[i].$get('name');
          let record: { model: string; services: string[] } = { model: modelName, services: [] };

          let services = models[i].$getServices();

          if (Object.keys(services).length)
            for (let prop in services)
              record.services.push(prop);

          result.push(record);
        }

        resolve({ data: result });
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
      users: 'string[]',
      permissions: [{ model: 'string', services: 'string[]' }]
    },
    schemaOptions: { required: true }
  })
  class AuthRoles extends MongoModel {
    authenticationModel: MongoModel;

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

    constructor() {
      super();

      this.authenticationModel = <MongoModel>State.getModel((<any>authConfig.usersModelConstructor.prototype).__name || authConfig.usersModelConstructor.name);
    }

    onCollection() {
      (<Authorization>State.getModel('Authorization')).roles = this.collection;
      this.$logger.info('checking roles collection');
      this.collection.find({})
        .toArray()
        .then(docs => {
          if (!docs || !docs.length) {
            this.$logger.info('no roles found');
            (<any>this.authenticationModel).getRootUser()
              .then((user: any) => {
                if (user)
                  this._mCreateRootRole(user)
                    .then((role: any) => this._mInsertRootRole(role))
                    .catch((error: any) => {
                      throw error;
                    });
                else
                  (<any>this.authenticationModel).createRootUser()
                    .then((user: any) => this._mCreateRootRole(user))
                    .then((role: any) => this._mInsertRootRole(role))
                    .catch((error: any) => {
                      throw error;
                    });
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
      (<Authorization>State.getModel('Authorization')).groups = this.collection;
    }
  }

  State.Models.push(Authorization, Permissions, AuthRoles, AuthGroups);
}
