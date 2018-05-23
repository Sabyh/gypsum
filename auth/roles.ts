import { MODEL, SERVICE } from "../decorators";
import { MongoModel } from "../models";
import { State } from "../state";
import { Authorization } from "./authorization";
import { RESPONSE_DOMAINS, IResponse } from "../types";
import { Context } from "../context";

@MODEL({
  secure: true,
  authorize: true,
  domain: RESPONSE_DOMAINS.SELF,
  schema: {
    name: { $required: true, $type: 'string' },
    users: { $required: true, $type: 'string[]' },
    permissions: { $required: true, $type: 'string[]' }
  }
})
export class Roles extends MongoModel {
  
  private _mCreateRootRole(user: any): Promise<any> {
    this.$logger.info('creating default role');
    let role = {
      name: 'administrator',
      users: [user._id],
      permissions: ['*/*/*']
    };

    return Promise.resolve(role);
  }

  private _mInsertRootRole(role: any) {
    this.$logger.info('inserting default role');
    this.collection.insertOne(role)
      .then(() => { })
      .catch(error => { throw 'Unable to create root user role: ' + error; });
  }

  public onCollection() {
    let usersModel = <MongoModel>this.app.$getModel('users');

    this.$logger.info('checking roles collection');
    this.collection.find({})
      .toArray()
      .then(docs => {
        if (!docs || !docs.length) {
          this.$logger.info('no roles found');
          (<any>usersModel).getRootUser()
            .then((user: any) => {
              if (user) {
                this._mCreateRootRole(user)
                  .then((role: any) => this._mInsertRootRole(role))
                  .catch((error: any) => {
                    throw error;
                  });
              } else {
                this.$logger.info('root user not found');
                (<any>usersModel).createRootUser()
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