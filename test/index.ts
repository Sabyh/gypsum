import { Gypsum } from '../main';
import { MODEL, SERVICE } from '../decorators';
import { MongoModel } from '../models';
import { Context } from '../context';
import { RESPONSE_DOMAINS } from '../types';

@MODEL({
  app: 'db01'
})
class Coll01 extends MongoModel {}

@MODEL({
  app: 'db02'
})
class Coll02 extends MongoModel {}

Gypsum
  .configure({
    dev: {
      database: {
        databases: [
          { name: 'db01' },
          { name: 'db02' }
        ]
      }
    }
  })
  .use({
    models: [Coll01, Coll02]
  })
  .bootstrap();