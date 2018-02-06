import { MongoClient, Db } from 'mongodb';
import { Logger } from '../misc/logger';
import { Safe } from '../misc/safe';
import { State } from '../state';
import { MongoModel } from '../models';

const safe = new Safe('mongo');

export function initMongo(): Promise<Db> {
  const logger = new Logger('initMongo');

  return new Promise((resolve, reject) => {
    MongoClient.connect(State.config.mongodb_url, (err, client) => {
      if (err) {
        logger.error('mongodb connection error:', err);
        return reject(err);
      }

      logger.info('mongodb connected successfully.');
      let db: Db = client.db(State.config.mongo_database_name)

      for (let model in State.models)
        if (State.models[model].type === 'Mongo')
          (<MongoModel>State.models[model])[<'setCollection'>safe.get('MongoModel.setCollection')](db.collection(State.models[model].$get('name')));

      process.on('SIGINT', () => cleanup(client));
      process.on('SIGTERM', () => cleanup(client));
      process.on('SIGHUP', () => cleanup(client));

      resolve(db);
    });
  });

}

function cleanup(db: MongoClient) {
  db.close(() => {
    console.log('Closing DB connection and stopping the app.');
    process.exit(0);
  });
}