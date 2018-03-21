import { MongoClient, Db } from 'mongodb';
import { Logger } from '../misc/logger';
import { Safe } from '../misc/safe';
import { State } from '../state';
import { MongoModel } from '../models';

const safe = new Safe('mongo');

export function initMongo(): Promise<boolean> {
  const logger = new Logger('initMongo');

  return new Promise((resolve, reject) => {
    let connections: any = [];
    let usedUrls: any[] = [];

    for (let i = 0; i < State.apps.length; i++) {
      let app = State.apps[i];

      app.mongodb_url = app.mongodb_url || State.config.mongodb_url;
      app.database_name = app.database_name || State.config.database_name;
      app.secure = app.secure === undefined ? app.subdomain ? false : State.config.secure : !!app.secure;

      let urlIndex = usedUrls.indexOf(app.mongodb_url);

      if (urlIndex === -1) {
        usedUrls.push(app.mongodb_url);
        connections.push({
          apps: [{
            name: app.name,
            database_name: app.database_name,
            models: app.models
          }],
          url: app.mongodb_url
        });

      } else {
        connections[urlIndex].apps.push({
          name: app.name,
          database_name: app.database_name,
          models: app.models
        });
      }
    }

    let connectionsDone = 0;
    let connectionsFailed = 0;

    for (let i = 0; i < connections.length; i++)
      Connect(connections[i], logger)
        .then(state => {
          connectionsDone++;

          if (connectionsDone + connectionsFailed === connections.length)
            resolve(true);
        })
        .catch(err => {
          connectionsFailed++;
          if (connectionsDone + connectionsFailed === connections.length)
            resolve(true);
        });
  });

}

function Connect(connection: any, logger: Logger) {

  return new Promise((resolve, reject) => {

    MongoClient.connect(connection.mongodb_url, (err, client) => {

      if (err) {
        logger.error('mongodb connection error:', err);
        return reject(err);
      }

      logger.info('mongodb connected successfully.');
      for (let j = 0; j < connection.apps.length; j++) {
        let currentApp = connection.apps[j];
        let db: Db = client.db(currentApp.database_name);

        if (currentApp.models && currentApp.models.length) {

          for (let i = 0; i < currentApp.models.length; i++) {
            let model = currentApp.models[i];
  
            if (model.type === 'Mongo')
              continue;
  
            (<MongoModel>model)[<'setCollection'>safe.get('MongoModel.setCollection')](db.collection(model.$get('name')));
          }
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