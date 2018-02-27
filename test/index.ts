import { Gypsum } from '../main';
import { MODEL } from '../decorators';
import { MongoModel } from '../models';
import { API_TYPES } from '../types';
// import { AuthPlugin, IAuthenticationConfig } from '../plugins/auth';

@MODEL({
  apiType: API_TYPES.REST,
  schema: {
    username: String,
    email: String,
    password: String,
    passwordSalt: String,
    active: { $type: Boolean, $default: false }
  }
})
class Users extends MongoModel {}


Gypsum.configure();

// AuthPlugin({
//   usersModelConstructor: Users,
//   authorization: true
// });
Gypsum.use({ models: [Users] })
Gypsum.bootstrap();