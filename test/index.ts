import { Gypsum } from '../main';
import { MODEL, APP, SERVICE } from '../decorators';
import { MongoModel } from '../models';
import { API_TYPES } from '../types';
import { App } from '../app';
import { Context } from '../context';

@MODEL({
  authorize: true,
  after: ['filter:-password,passwordSalt']
})
class Users extends MongoModel {

  @SERVICE({
    authorize: { field: '_id', match: 'params.id' }
  })
  findById(id: string, options: any, ctx?: Context) {
    return super.findById(id, options);
  }

  @SERVICE({
    authorize: { field: '_id', fetch: 'query', match: '_id' }
  })
  findOne(id: string, options: any, ctx?: Context) {
    if (ctx && ctx.get('fetchedData'))
      return Promise.resolve({ data: ctx.get('fetchedData')[0] || {} });
    else
      return super.findOne(id, options);
  }

  @SERVICE({
    after: ['filter:-password,passwordSalt']
  })
  insertOne(document: any) {
    return super.insertOne(document);
  }
}

@APP({
  dev: {
    mongodb_url: 'mongodb://localhost:27017',
    database_name: 'gypsum_dev',
    models: [],
  }
})
class Api extends App {}

Gypsum.bootstrap({
  config: {
    dev: {
      port: 7772
    }
  },
  apps: [Api]
});