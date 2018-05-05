import * as path from 'path';
import * as express from 'express';
import { App } from "../app";
import { APP } from "../decorators";
import { API_TYPES } from "../types";
import { State } from "../state";
import { File } from "./file";

@APP({
  dev: {
    models: [File],
    apiType: API_TYPES.REST
  }
})
class Storage extends App {

  middlerwares(app: express.Express) {
    app.use(express.static(path.join(State.root, State.storage.storageDir)));
  }
}

let storage = new Storage();
storage.init();

State.apps.push(storage);