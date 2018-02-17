import { MongoClient, Db } from 'mongodb';
import { Logger } from '../misc/logger';
import { Safe } from '../misc/safe';
import { State } from '../state';
import { MongoModel } from '../models';

const safe = new Safe('mongo');

export function initMongo(): Promise<boolean> {
  const logger = new Logger('initMongo');

  return new Promise((resolve, reject) => {
    let apps = State.apps;
    let connectionURL = State.config.mongodb_url;

    MongoClient.connect(connectionURL, (err, client) => {
      if (err) {
        logger.error('mongodb connection error:', err);
        return reject(err);
      }

      logger.info('mongodb connected successfully.');

      let db: Db = client.db(State.config.database_name);

      for (let model in State.models)
        if (State.models[model].type === 'Mongo')
          (<MongoModel>State.models[model])[<'setCollection'>safe.get('MongoModel.setCollection')](db.collection(State.models[model].$get('name')));

      if (apps.length > 0) {
        for (let i = 0; i < apps.length; i++) {
          let db: Db = client.db(apps[i].database || apps[i].name);

          for (let model in State.models)
            if (State.models[model].type === 'Mongo' && State.models[model].$get('app') === apps[i].name)
              (<MongoModel>State.models[model])[<'setCollection'>safe.get('MongoModel.setCollection')](db.collection(State.models[model].$get('name')));
        }
      }

      process.on('SIGINT', () => cleanup(client));
      process.on('SIGTERM', () => cleanup(client));
      process.on('SIGHUP', () => cleanup(client));

      resolve(true);
    });
  });

}

function cleanup(client: MongoClient) {
  client.close(() => {
    console.log('Closing DB connection and stopping the app.');
    process.exit(0);
  });
}