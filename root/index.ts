import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';
import { APP } from "../decorators";
import { App } from "../app";
import { API_TYPES } from "../types";
import { Apps } from "./apps-model";
import { State } from '../state';

@APP({
  dev: {
    models: [Apps],
    apiType: API_TYPES.REST
  }
})
export class Root extends App {

  middlewares(app: express.Express) {
    if (State.middlewares)
      State.middlewares(app);

    if (State.config.statics && State.config.statics.length) {
      for (let i = 0; i < State.config.statics.length; i++) {
        let parts = State.config.statics[i].split(',');
        let fileName = parts[0];

        if (!fs.existsSync(path.join(State.root, fileName)))
          try { fs.mkdirSync(path.join(State.root, fileName)); }
          catch (err) { console.log(err); }

        let prefix = parts[1] || '';
        this.$logger.info(`static file path: '${path.join(State.root, fileName)}', static prefix: '${prefix}'`);
        app.use(prefix, express.static(path.join(State.root, fileName)));
      }
    }
  }
}

let app = new Root();
State.apps.push(app);