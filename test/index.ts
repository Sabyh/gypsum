import { Gypsum } from '../main';
import { MODEL, APP } from '../decorators';
import { MongoModel } from '../models';
import { API_TYPES } from '../types';
import { App } from '../app';
import { AuthPlugin, IAuthenticationConfig } from '../plugins/auth';

@MODEL({
  // apiType: API_TYPES.REST,
  // schema: {
  //   username: String,
  //   email: String,
  //   password: String,
  //   passwordSalt: String,
  //   active: { $type: Boolean, $default: false }
  // }
})
class Users extends MongoModel { }

// let UserAuthModels = AuthPlugin({ usersModelConstructor: Users, authorization: true });

@APP({
  dev: {
    mongodb_url: 'mongodb://localhost:27017',
    database_name: 'gypsym_dev',
    models: [Users],
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