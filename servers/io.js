"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("../state");
const context_1 = require("../context");
const types_1 = require("../types");
const logger_1 = require("../misc/logger");
const safe_1 = require("../misc/safe");
let safe = new safe_1.Safe('ioServer');
function initSocket(io) {
    state_1.State[safe.get('State._io')] = io;
    io.on('connection', (socket) => {
        const logger = new logger_1.Logger('ioServer');
        state_1.State.pushSocket(socket);
        logger.info(`socket connected: { socketId: ${socket.id}, pid: ${process.pid} }`);
        logger.info('Implementing socket web services');
        if (state_1.State.models && state_1.State.models.length) {
            let models = state_1.State.models;
            for (let i = 0; i < models.length; i++) {
                let model = models[i];
                if (model.$get('apiType') === types_1.API_TYPES.REST)
                    continue;
                let services = model.$getServices();
                for (let service in services) {
                    if (services[service].apiType === types_1.API_TYPES.REST)
                        continue;
                    socket.on(services[service].event, context_1.Context.Socket(socket, model, services[service]));
                }
            }
        }
        socket.on('disconnect', () => {
            context_1.Context.deleteContextsOf('socket', socket.id);
            state_1.State.deleteSocket(socket.id);
            io.emit('user disconnected');
            socket.disconnect();
        });
    });
    process.on('message', msg => {
        if (msg.data && msg.action === 'response' && msg.socketId) {
            let response = msg.data;
            let socket = state_1.State.getSocket(msg.socketId);
            if (socket) {
                if (response.domain === types_1.RESPONSE_DOMAINS.ROOM && response.room) {
                    socket.to(response.room).emit(response.event, response);
                }
                else if (response.domain === types_1.RESPONSE_DOMAINS.ALL_ROOM && response.room) {
                    socket.broadcast.to(response.room).emit(response.event, response);
                }
                else if (response.domain === types_1.RESPONSE_DOMAINS.OTHERS) {
                    socket.broadcast.emit(response.event, response);
                }
                else if (response.domain === types_1.RESPONSE_DOMAINS.ALL) {
                    io.sockets.emit(response.event, response);
                }
            }
        }
    });
}
exports.initSocket = initSocket;
//# sourceMappingURL=io.js.map