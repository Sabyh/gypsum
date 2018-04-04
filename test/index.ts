import { Gypsum } from '../main';
import { MODEL, APP, SERVICE } from '../decorators';
import { MongoModel } from '../models';
import { API_TYPES } from '../types';
import { App } from '../app';
import { AuthPlugin, IAuthenticationConfig } from '../plugins/auth';

@MODEL({
  
})
class Users extends MongoModel {

  @SERVICE({
    after: ['filter:-password,passwordSalt']
  })
  insertOne(document: any) {
    return super.insertOne(document);
  }
}

let UserAuthModels = AuthPlugin({ usersModelConstructor: Users, authorization: true }, {
  service: 'gmail',
  auth: {
    user: 'amrmrdb51@gmail.com',
    pass: '^mail|AMR8$'
  }
});

@APP({
  dev: {
    mongodb_url: 'mongodb://localhost:27017',
    database_name: 'gypsum_dev',
    models: [...UserAuthModels],
  }
})
class Api extends App {}

Gypsum.bootstrap({
  config: {
    dev: {
      port: 7772,
      logger_options: { all: { level: ['all'] } }
    }
  },
  apps: [Api]
});