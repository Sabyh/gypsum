import { Gypsum } from '../main';
import { MODEL, APP, SERVICE } from '../decorators';
import { MongoModel } from '../models';
import { App } from '../app';
import { Context } from '../context';

// Test Model
@MODEL()
class Parent extends MongoModel {

  @SERVICE()
  update(filter: any, update: any, ctx?: Context) {
    let childModel = <MongoModel>this.app.$getModel('child');
    return childModel.updateById("5b40626f63c971f8ae743ed4", { $set: { name: 'newchild' }})
      .then(res => {
        return Context.Publish(childModel, 'update', res);
      })
  }
}

@MODEL()
class Child extends MongoModel {}

@APP({
  dev: {
    mongodb_url: 'mongodb://localhost:27017',
    database_name: 'gypsum_test',
    models: [Parent, Child],
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