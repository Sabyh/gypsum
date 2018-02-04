import { Collection } from 'mongodb';
import { State } from '../state';
import { Model } from '../model/model';
import { MongoModel } from '../model/mongo-model';
import { Context } from '../context';
import { MODEL, HOOK } from '../decorators';
import { RESPONSE_CODES } from '../types/index';
import { IPermission } from './roles';
import { objectUtil } from '../util/index';
import { Permissions } from './permissions';

export namespace Authorization {
  export interface IAuthorizeOption {
    roles?: string | string[];
    groups?: string | string[];
    fields?: string | string[];
  }
}

@MODEL()
export class Authorization extends Model {
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
  authorize(ctx: Context, options: boolean | string[]) {
    if (!ctx.user)
      return ctx.next({
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
              return ctx.next();
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
              return ctx.next({
                message: `${Authorization}: bad options provided: ${options}`,
                code: RESPONSE_CODES.BAD_REQUEST
              });
              
            let val01 = objectUtil.getValue(ctx.user, <string>userField);
            let val02 = objectUtil.getValue((<any>ctx)[contextField], contextSubField);

            if (userField === '_id')
              val01 = val01.toString();

            if (val01 !== val02)
              return ctx.next({
                message: 'user not authorized',
                code: RESPONSE_CODES.UNAUTHORIZED
              });
          }

          return ctx.next();
        }

        ctx.next({
          message: 'user not authorized',
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      })
      .catch(error => ctx.next({
        message: 'Error authorizing user',
        original: error,
        code: RESPONSE_CODES.UNKNOWN_ERROR
      }));
  }
}