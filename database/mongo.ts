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
    let connections: any = [{ apps: [{ name: 'default', database_name: State.config.database_name }], url: State.config.mongodb_url }];
    let usedUrls: any[] = [State.config.mongodb_url];

    if (apps.length > 0) {
      for (let i = 0; i < apps.length; i++) {
        if (!apps[i].mongodb_url) {
          connections[0].apps.push({
            name: apps[0].name,
            database_name: apps[0].database_name || State.config.database_name
          });

        } else {
          let urlIndex = usedUrls.indexOf(apps[i].mongodb_url);

          if (urlIndex === -1) {
            usedUrls.push(apps[i].mongodb_url);
            connections.push({
              apps: [{
                name: apps[0].name,
                database_name: apps[0].database_name || State.config.database_name
              }],
              url: apps[i].mongodb_url
            });

          } else {
            connections[urlIndex].apps.push({
              name: apps[0].name,
              database_name: apps[0].database_name || State.config.database_name
            });
          }
        }
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
      for (let i = 0; i < connection.apps.length; i++) {
        let currentApp = connection.apps[i];
        let db: Db = client.db(currentApp[i].database_name);

        for (let prop in State.models) {
          let model = State.models[prop];

          if (model.type === 'Mongo')
            continue;

          let modelAppName = model.$get('app') || 'default';

          if (currentApp.name !== modelAppName)
            continue;

            (<MongoModel>model)[<'setCollection'>safe.get('MongoModel.setCollection')](db.collection(model.$get('name')));
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