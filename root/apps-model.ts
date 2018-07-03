import { MODEL, SERVICE } from "../decorators";
import { Model } from "../models";
import { Context } from "../context";
import { State } from "../state";

@MODEL()
export class Apps extends Model {

  @SERVICE({
    params: ['name'],
    args: ['params.name']
  })
  getApp(name: string, ctx?: Context) {
    if (!name || name.toLowerCase() === 'root')
      return Promise.resolve(null);

    let app = State.apps.find(_app => _app.name === name.toLowerCase());

    if (!app)
      return Promise.resolve({ data: null });
    else
      return Promise.resolve({ data: app.$getApis() });
  }

  @SERVICE({
    args: ['query.apps']
  })
  getApps(apps: string[]) {
    if (apps && apps.length) {
      let apis = [];

      for (let i = 0; i < apps.length; i++) {
        if (apps[i].toLowerCase() === 'root')
          continue;

        let app = State.apps.find(_app => _app.name === apps[i].toLowerCase());

        if (app) {
          apis.push(app.$getApis());
        }
      }

      return Promise.resolve({ data: apis });
    }

    return Promise.resolve({ data: [] });
  }

  @SERVICE()
  getAllApps() {
    let apis = [];
    for (let i = 0; i < State.apps.length; i++) {
      if (State.apps[i].name.toLowerCase() === 'root')
        continue;

      apis.push(State.apps[i].$getApis());
    }

    return Promise.resolve({ data: apis });
  }
}