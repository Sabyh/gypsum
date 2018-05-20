import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';
import { App } from "../app";
import { APP } from "../decorators";
import { API_TYPES } from "../types";
import { State } from "../state";
import { File } from "./file";

console.log('storage app called');

@APP({
  dev: {
    models: [File],
    apiType: API_TYPES.REST
  }
})
class Storage extends App {

  constructor() {
    super();

    console.log('storageDir', State.storage.storageDir);
    if (!fs.existsSync(State.storage.storageDir))
      try { fs.mkdirSync(State.storage.storageDir); }
      catch (err) { console.log(err); }
  }

  middlewares(app: express.Express) {
    console.log('serving storage static from path:');
    console.log(State.storage.storageDir);
    app.use(express.static(State.storage.storageDir));
  }
}

let storage = new Storage();
storage.init();

State.apps.push(storage);