import { Gypsum } from '../main';
import { MODEL, APP } from '../decorators';
import { MongoModel } from '../models';
import { App } from '../app';

// Test Model
@MODEL()
class Test extends MongoModel { }

@APP({
  dev: {
    mongodb_url: 'mongodb://localhost:27017',
    database_name: 'gypsum_dev',
    models: [Test],
  }
})
class Api extends App { }

Gypsum
  .config({
    config: {
      dev: {
        port: 7772
      }
    }
  })
  .bootstrap({
    apps: [Api]
  });