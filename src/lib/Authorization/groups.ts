import { MongoModel } from '../model/mongo-model';
import { MODEL } from '../decorators/index';
import { Authorization } from './main';
import { State } from '../state';

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
export class AuthGroups extends MongoModel {

  onCollection() {    
    (<Authorization>State.getModel('Authorization')).groups = this.collection;
  }
}