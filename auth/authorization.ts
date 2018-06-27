import * as Validall from 'validall';
import * as MongoDB from 'mongodb';
import { MODEL, HOOK } from "../decorators";
import { Model, MongoModel } from "../models";
import { RESPONSE_CODES, RESPONSE_DOMAINS } from '../types';
import { objectUtil } from '../util';
import { State } from '../state';
import { Context } from '../context';
import { toObjectID } from '../util/toObjectId';

@MODEL()
export class Authorization extends Model {
  roles: MongoDB.Collection;
  groups: MongoDB.Collection;

  private _mGetUserRolesFromGroups(id: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let groups = <MongoModel>this.app.$getModel('groups');

      groups.find({ users: { $in: [id] } })
        .then(res => {
          let results = res.data;
          if (results && results.length)
            resolve(results.reduce((prev: any, current: any) => {
              return prev.push(...current.roles);
            }, []));
          else
            resolve([]);
        });
    });
  }

  private _mGetUserPermissionsFromRules(id: string, extraRules: string[] = []): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let roles = <MongoModel>this.app.$getModel('roles');

      roles.find({ $or: [{ users: { $in: [id] } }, { name: { $in: extraRules } }] })
        .then(res => {
          let results = res.data;

          if (results && results.length) {
            let permissions: any = [];
            results.forEach((result: any) => {
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

      let model: any = State.getModel(`${appName}.${modelName}`);

      if (!model)
        return reject({
          message: `model ${appName}.${modelName} not found`,
          code: RESPONSE_CODES.BAD_REQUEST
        });

      model.find(options.fetch.query, options.fetch.options)
        .then((res: any) => {
          if (!res || !res.data)
            return reject({
              message: 'document not found',
              code: RESPONSE_CODES.BAD_REQUEST
            });

          let docs = res.data;

          for (let i = 0; i < docs.length; i++) {
            let matchParts = options.match.split('|');
            let matchPass = false;

            for (let j = 0; j < matchParts.length; j++) {
              if (matchParts[i] && matchParts[i].trim()) {
                let currentPart = matchParts[i].trim();
                let compareValue = currentPart.charAt(0) === '$' ? objectUtil.getValue(docs[i], currentPart) : currentPart;

                if (compareValue instanceof MongoDB.ObjectID)
                  compareValue = compareValue.toString();

                if (options.userFieldValue === compareValue)
                  matchPass = true;
                break;
              }

              if (!matchPass)
                return reject({
                  message: 'user not authorized',
                  code: RESPONSE_CODES.UNAUTHORIZED
                });
            }
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
  authorize(options: { field: string, match: string, fetch: any } | boolean, ctx: Context): Promise<void> {

    let appName = ctx._appName.toLowerCase();
    let modelName = ctx.model.name.toLowerCase();
    let serviceName = ctx.service.__name.toLowerCase();

    return new Promise((resolve, reject) => {

      this.$logger.info(`authorizing service:`);
      this.$logger.info(`${appName}${modelName}${serviceName}`);
      this.$logger.info(`options:`);
      this.$logger.info(options);
      this.$logger.debug('params:');
      this.$logger.debug(ctx.params);
      this.$logger.debug('query:');
      this.$logger.debug(ctx.query);
      this.$logger.debug('body:');
      this.$logger.debug(ctx.body);

      if (!ctx.user)
        return reject({
          message: 'user not logged in',
          code: RESPONSE_CODES.UNAUTHORIZED
        });

      if (Validall.Types.object(options) && (<any>options).field && (<any>options).match) {

        let userFieldValue = objectUtil.getValue(ctx.user, (<any>options).field);

        if (!userFieldValue)
          return reject({
            message: `${(<any>options).field} dose not exist in user object`,
            code: RESPONSE_CODES.UNAUTHORIZED
          });

        if (userFieldValue instanceof MongoDB.ObjectID)
          userFieldValue = userFieldValue.toString();

        if (!(<any>options).fetch) {
          let matchValue = '';
          if ((<any>options).match.charAt(0) === '$')
            matchValue = objectUtil.getValue(ctx, (<any>options).match.slice(1));
          else
            matchValue = (<any>options).match;

          if (userFieldValue !== matchValue)
            return reject({
              message: 'user not authorized',
              code: RESPONSE_CODES.UNAUTHORIZED
            });

          return resolve();

        } else {
          let fetchObj: any = { query: {} };

          if (typeof (<any>options).fetch === 'string') {
            if ((<any>options).fetch.charAt(0) === "$")
              fetchObj = objectUtil.getValue(ctx, (<any>options).fetch.slice(1));
            else
              return reject({
                message: 'invalid authorization options',
                code: RESPONSE_CODES.BAD_REQUEST
              });

          } else {

            if (typeof (<any>options).fetch.query === 'string') {
              if ((<any>options).fetch.query.charAt(0) === '$')
                fetchObj.query = objectUtil.getValue(ctx, (<any>options).fetch.query.slice(1));
              else
                return reject({
                  message: 'invalid authorization options',
                  code: RESPONSE_CODES.BAD_REQUEST
                });
            } else {
              for (let prop in (<any>options).fetch.query)
                if (typeof (<any>options).fetch.query[prop] === 'string' && (<any>options).fetch.query[prop].charAt(0) === '$')
                  fetchObj.query[prop] = objectUtil.getValue(ctx, (<any>options).fetch.query[prop].slice(1));
            }

            if (typeof (<any>options).fetch.options === 'string') {
              if ((<any>options).fetch.options.charAt(0) === '$')
                fetchObj.options = objectUtil.getValue(ctx, (<any>options).fetch.options.slice(1));
              else
                return reject({
                  message: 'invalid authorization options',
                  code: RESPONSE_CODES.BAD_REQUEST
                });
            }
          }

          fetchObj.query = toObjectID(fetchObj.query);

          return this._mFetchData(appName, modelName, { fetch: fetchObj, userFieldValue: userFieldValue, match: (<any>options).match }, ctx)
            .then(() => resolve())
            .catch(err => reject(err));
        }
      }

      this.$logger.debug('getting user rules...');
      this._mGetUserRolesFromGroups(ctx.user._id)
        .then(roles => this._mGetUserPermissionsFromRules(ctx.user._id, roles))
        .then((permissions: string[]) => {
          if (permissions.length) {
            for (let i = 0; i < permissions.length; i++) {
              let parts = permissions[i].split('/');

              if (
                parts[0] === '*' || parts[0] === appName &&
                parts[1] === '*' || parts[1] === modelName &&
                parts[2] === '*' || parts[2] === serviceName
              ) {
                return resolve();
              }
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