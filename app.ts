import { IAppOptions, IAppKeys } from './decorators/app';
import { Model } from './models';
import { Safe } from './misc/safe';

const safe = new Safe('app');

export class App {
  models: Model[] = [];
  name = this.constructor.name.toLowerCase();

  init() {
    let models = this.$get('models');

    for (let i = 0; i < models.length; i++) {
      this.models.push(new models[i]());
      this.models[i][<'init'>safe.get('model.init')](this.name);
    }
  }

  $get(prop: IAppKeys) {
    return (<any>this)[`__${prop}`];
  }

  $getModel(name: string) {
    return this.models.find(model => model.name === name.toLowerCase()) || undefined;
  }
}