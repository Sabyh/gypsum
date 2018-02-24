import { Gypsum } from '../main';
import { MODEL } from '../decorators';
import { MongoModel } from '../models';
import { AuthPlugin, IAuthenticationConfig } from '../plugins/auth';

@MODEL({
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

AuthPlugin({
  usersModelConstructor: Users,
  authorization: true
});

Gypsum.bootstrap();