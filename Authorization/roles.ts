import { MongoModel } from '../models';
import { MODEL } from '../decorators';
import { State } from '../state';
import { Authorization } from './main';

export interface IPermission {
  model: string;
  services: string[];
}

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
export class AuthRoles extends MongoModel {
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

    this.authenticationModel = <MongoModel>State.getModel('Authentication');
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