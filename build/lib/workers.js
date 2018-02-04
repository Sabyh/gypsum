"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster = require("cluster");
const os_1 = require("os");
const logger_1 = require("./misc/logger");
const logger = new logger_1.Logger('workers');
let isRestarting = false;
function initializeWorkers(processesCount) {
    let cores = os_1.cpus().length;
    let workersCount = (processesCount === 'max' || processesCount >= cores) ? cores : processesCount;
    logger.info(`forking processes count: ${workersCount}`);
    for (let i = 0; i < workersCount; i++)
        cluster.fork();
    logger.info('listening on worker crash');
    cluster.on('exit', (worker, code, signal) => {
        if (code !== 0) {
            logger.warn(`Worker ${worker.id} crashed`);
            logger.warn(`Starting new worker`);
            cluster.fork();
        }
    });
    logger.info('listening on worker online');
    cluster.on('online', (worker) => {
        logger.info(`worker online: ${worker.id}, process: ${worker.process.pid}`);
        prepareWorker(worker);
    });
}
exports.initializeWorkers = initializeWorkers;
function restartWorkers(workers, index) {
    const worker = workers[index];
    if (!worker) {
        isRestarting = false;
        return;
    }
    worker.on('exit', () => {
        if (!worker.exitedAfterDisconnect)
            return;
        logger.info(`Exited process ${worker.process.pid}`);
        let newWorker = cluster.fork();
        newWorker.on('listening', () => {
            restartWorkers(workers, index + 1);
        });
    });
    worker.disconnect();
}
function prepareWorker(worker) {
    logger.info(`Preparing worker: ${worker.id}`);
    worker.on('message', msg => {
        if (msg.action === 'restart all') {
            if (isRestarting)
                return;
            else
                isRestarting = true;
            let workers = [];
            for (let wid in cluster.workers) {
                let worker = cluster.workers[wid];
                if (worker)
                    workers.push(worker);
            }
            logger.info('restarting workers..');
            restartWorkers(workers, 0);
        }
        else if (msg.target === 'others' || msg.target === 'all') {
            publishMsg(msg, msg.target === 'others' ? worker.process.pid : undefined);
        }
    });
}
function publishMsg(msg, pid) {
    for (let wid in cluster.workers) {
        let worker = cluster.workers[wid];
        if (worker)
            if (pid && worker.process.pid === pid)
                continue;
            else
                worker.send(msg);
    }
}
//# sourceMappingURL=workers.js.map