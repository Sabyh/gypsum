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
        let apps = state_1.State.apps;
        let connectionURL = state_1.State.config.mongodb_url;
        mongodb_1.MongoClient.connect(connectionURL, (err, client) => {
            if (err) {
                logger.error('mongodb connection error:', err);
                return reject(err);
            }
            logger.info('mongodb connected successfully.');
            let db = client.db(state_1.State.config.database_name);
            for (let model in state_1.State.models)
                if (state_1.State.models[model].type === 'Mongo')
                    state_1.State.models[model][safe.get('MongoModel.setCollection')](db.collection(state_1.State.models[model].$get('name')));
            if (apps.length > 0) {
                for (let i = 0; i < apps.length; i++) {
                    let db = client.db(apps[i].database || apps[i].name);
                    for (let model in state_1.State.models)
                        if (state_1.State.models[model].type === 'Mongo' && state_1.State.models[model].$get('app') === apps[i].name)
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