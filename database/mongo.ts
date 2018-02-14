import { MongoClient, Db } from 'mongodb';
import { Logger } from '../misc/logger';
import { Safe } from '../misc/safe';
import { State } from '../state';
import { MongoModel } from '../models';

const safe = new Safe('mongo');

export function initMongo(): Promise<boolean> {
  const logger = new Logger('initMongo');

  return new Promise((resolve, reject) => {
    let mongoOptions = State.config.database;
    let connectionURL = 'mongodb://';

    if (mongoOptions.username && mongoOptions.password)
      connectionURL += mongoOptions.username + ':' + mongoOptions.password + '@';

    connectionURL += mongoOptions.host + ':' + mongoOptions.port;

    MongoClient.connect(connectionURL, (err, client) => {
      if (err) {
        logger.error('mongodb connection error:', err);
        return reject(err);
      }

      logger.info('mongodb connected successfully.');

      if (mongoOptions.databases!.length === 1) {
        let db: Db = client.db(mongoOptions.databases![0].name);

        for (let model in State.models)
          if (State.models[model].type === 'Mongo')
            (<MongoModel>State.models[model])[<'setCollection'>safe.get('MongoModel.setCollection')](db.collection(State.models[model].$get('name')));

      } else {
        for (let i = 0; i < mongoOptions.databases!.length; i++) {
          let db: Db = client.db(mongoOptions.databases![i].name);
          let app = mongoOptions.databases![i].app || mongoOptions.databases![i].name;

          for (let model in State.models)
            if (State.models[model].type === 'Mongo' && State.models[model].$get('app') === app)
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