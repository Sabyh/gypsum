import { Gypsum } from '../main';
import { MODEL, SERVICE } from '../decorators';
import { MongoModel } from '../models';
import { Context } from '../context';
import { RESPONSE_DOMAINS } from '../types';

@MODEL({
  schema: {
    name: 'string',
    active: { $type: 'boolean', $default: false, $props: { constant: true } }
  }
})
class Users extends MongoModel {}

Gypsum
  .configure()
  .use({
    models: [Users]
  })
  .bootstrap();