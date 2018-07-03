import * as fs from 'fs';
import * as express from 'express';
import { App } from "../app";
import { APP } from "../decorators";
import { API_TYPES } from "../types";
import { State } from "../state";
import { File } from "./file";
import { Model } from '../models';

export function initStorage(extendedFileModel: typeof Model) {

  @APP({
    dev: {
      models: [(extendedFileModel || File)],
      apiType: API_TYPES.REST
    }
  })
  class Storage extends App {
  
    constructor() {
      super();
      
      if (!fs.existsSync(State.storage.storageDir))
        try { fs.mkdirSync(State.storage.storageDir); }
        catch (err) { console.log(err); }
    }
  
    middlewares(app: express.Express) {
      app.use(express.static(State.storage.storageDir));
    }
  }
  
  let storage = new Storage();
  
  State.apps.push(storage);
}
