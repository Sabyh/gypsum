import { State } from '../state';
import { Context } from '../context';
import { Model } from '../models';
import { Response, API_TYPES, RESPONSE_DOMAINS } from '../types';
import { Logger } from '../misc/logger';
import { Safe } from '../misc/safe';
import * as IO from 'socket.io';

let safe = new Safe('ioServer');

export function initSocket(io: any) {

  State[<'_io'>safe.get('State._io')] = io;

  io.on('connection', (socket: any) => {
    const logger = new Logger('ioServer');

    State.pushSocket(socket);

    logger.info(`socket connected: { socketId: ${socket.id}, pid: ${process.pid} }`);

    logger.info('Implementing socket web services');
    if (State.models && State.models.length) {
      let models = State.models;

      for (let i = 0; i < models.length; i++) {
        let model: Model = models[i];

        if (model.$get('apiType') === API_TYPES.REST)
          continue;

        let services = model.$getServices();

        for (let service in services) {
          if (services[service].apiType === API_TYPES.REST)
            continue;

          socket.on(services[service].event, Context.Socket(socket, model, services[service]));
        }
      }
    }

    socket.on('disconnect', () => {
      Context.deleteContextsOf('socket', socket.id);
      State.deleteSocket(socket.id);
      io.emit('user disconnected');
      socket.disconnect();
    });
  });

  process.on('message', msg => {
    if (msg.data && msg.action === 'response' && msg.socketId) {
      let response: Response = msg.data;
      let socket = State.getSocket(msg.socketId);

      if (socket) {
        if (response.domain === RESPONSE_DOMAINS.ROOM && response.room) {
          socket.to(response.room).emit(response.event, response);
        } else if (response.domain === RESPONSE_DOMAINS.ALL_ROOM && response.room) {
          socket.broadcast.to(response.room).emit(response.event, response);
        } else if (response.domain === RESPONSE_DOMAINS.OTHERS) {
          socket.broadcast.emit(response.event, response);
        } else if (response.domain === RESPONSE_DOMAINS.ALL) {
          io.sockets.emit(response.event, response);
        }
      }
    }
  });
}