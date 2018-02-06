import { Gypsum } from '../main';
import { MODEL, SERVICE } from '../decorators';
import { Model } from '../models';
import { Context } from '../context';
import { RESPONSE_DOMAINS } from '../types';

@MODEL({
  after: ['filter:-password,passwordSalt'],
  schema: { 
    username: 'string',
    email: 'string',
    password: 'string',
    passwordSalt: 'string',
    'age?': 'number',
    createdAt: { $type: 'date', $default: 'Date.now' },
    isActive: { $type: 'boolean', $default: false }
  },
  schemaOptions: { required: true, strict: true }
})
class Users extends Model {

  @SERVICE({
    domain: RESPONSE_DOMAINS.ALL
  })
  publish(ctx: Context) {
    ctx.ok({ pid: process.pid });
  }
}

function testHook01(ctx: Context, place: string) {
  console.log('message from test 01, ' + place);
  ctx.next();
}

Gypsum
  .configure({
    dev: {
      server: {
        processes: 3
      }
    }
  })
  .use({
    models: [Users],
    hooks: [testHook01]
  })
  .bootstrap();