"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const logger_1 = require("../misc/logger");
const safe_1 = require("../misc/safe");
const state_1 = require("../state");
const safe = new safe_1.Safe('mongo');
function initMongo() {
    const logger = new logger_1.Logger('initMongo');
    return new Promise((resolve, reject) => {
        let mongoOptions = state_1.State.config.database;
        let connectionURL = 'mongodb://';
        if (mongoOptions.username && mongoOptions.password)
            connectionURL += mongoOptions.username + ':' + mongoOptions.password + '@';
        connectionURL += mongoOptions.host + ':' + mongoOptions.port;
        mongodb_1.MongoClient.connect(connectionURL, (err, client) => {
            if (err) {
                logger.error('mongodb connection error:', err);
                return reject(err);
            }
            logger.info('mongodb connected successfully.');
            if (mongoOptions.databases.length === 1) {
                let db = client.db(mongoOptions.databases[0].name);
                for (let model in state_1.State.models)
                    if (state_1.State.models[model].type === 'Mongo')
                        state_1.State.models[model][safe.get('MongoModel.setCollection')](db.collection(state_1.State.models[model].$get('name')));
            }
            else {
                for (let i = 0; i < mongoOptions.databases.length; i++) {
                    let db = client.db(mongoOptions.databases[i].name);
                    let app = mongoOptions.databases[i].app || mongoOptions.databases[i].name;
                    for (let model in state_1.State.models)
                        if (state_1.State.models[model].type === 'Mongo' && state_1.State.models[model].$get('app') === app)
                            state_1.State.models[model][safe.get('MongoModel.setCollection')](db.collection(state_1.State.models[model].$get('name')));
                }
            }
            process.on('SIGINT', () => cleanup(client));
            process.on('SIGTERM', () => cleanup(client));
            process.on('SIGHUP', () => cleanup(client));
            resolve(true);
        });
    });
}
exports.initMongo = initMongo;
function cleanup(client) {
    client.close(() => {
        console.log('Closing DB connection and stopping the app.');
        process.exit(0);
    });
}
//# sourceMappingURL=mongo.js.map