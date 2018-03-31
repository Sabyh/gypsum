import { State } from '../state';
import { Context } from '../context';
import { Model } from '../models';
import { Response, API_TYPES, RESPONSE_DOMAINS } from '../types';
import { Logger } from '../misc/logger';
import { Safe } from '../misc/safe';
import * as IO from 'socket.io';
import { App } from '../app';

let safe = new Safe('ioServer');

export function initSocket(io: any) {

  io.use((socket: any, next: Function) => {

    if (socket.handShake.query && socket.handShake.query.app) {
      let namespace = socket.handShake.query.app;
      let appName = namespace.split('/')[0];

      let app = State.apps.find(_app => _app.name === appName);

      if (app) {
        if ('onHandShake' in app)
          (<any>app).onHandShake(socket, namespace, next);
        else
          next()

      } else {
        next(new Error(`undefined app name: ${appName}`));
      }

    } else {
      next(new Error('invalid handshake query!'));
    }

  });

  for (let i = 0; i < State.apps.length; i++) {
    if (State.apps[i].$get('apiType') === API_TYPES.REST)
      continue;

    let ns = io.of(State.apps[i].name.toLowerCase());
    State.ioNamespaces[State.apps[i].name.toLowerCase()] = ns;
    initializeApp(ns, State.apps[i]);

    let appNamespaces = State.apps[i].$get('namespaces');

    if (appNamespaces && appNamespaces.length) {
      for (let i = 0; i < appNamespaces.length; i++) {
        let ns = io.of(State.apps[i].name.toLowerCase() + '/' + appNamespaces[i].toLowerCase());
        State.ioNamespaces[State.apps[i].name.toLowerCase() + '/' + appNamespaces[i].toLowerCase()] = ns;
        initializeApp(ns, State.apps[i]);
      }
    }
  }

  process.on('message', msg => {
    if (msg.data && msg.action === 'response') {
      let response: Response = msg.data;
      let namespace = msg.namespace || 'default';

      if (State.ioNamespaces[namespace]) {
        if ((response.domain === RESPONSE_DOMAINS.ROOM || response.domain === RESPONSE_DOMAINS.ALL_ROOM) && response.room) {
          State.ioNamespaces[namespace].to(response.room).emit(response.event, response);
        } else if (response.domain === RESPONSE_DOMAINS.OTHERS || response.domain === RESPONSE_DOMAINS.ALL) {
          State.ioNamespaces[namespace].sockets.emit(response.event, response);
        }
      }
    } else if (msg.data && msg.action === 'join room') {
      let room = msg.data.room;
      let socketIds = msg.data.socketIds;
      let ns = State.ioNamespaces[msg.namespace];

      if (ns && room && socketIds && socketIds.length) {
        for (let i = 0; i < socketIds.length; i++) {
          let nsSockets = ns.sockets.sockets;

          if (nsSockets[socketIds[i]]) {
            nsSockets[socketIds[i]].join(room);
            break;
          }
        }
      }
    }
  });
}

function initializeApp(io: any, app: App, ns: string = app.name) {

  io.on('connection', (socket: any) => {
    const logger = new Logger('ioServer');

    if ('onConnect' in app)
      (<any>app).onConnect(socket);

    logger.info(`socket connected: { socketId: ${socket.id}, pid: ${process.pid} }`);

    logger.info('Implementing socket web services');

    if (app.models && app.models.length) {

      for (let i = 0; i < app.models.length; i++) {
        let model: Model = app.models![i];

        if (model.$get('apiType') === API_TYPES.REST)
          continue;

        let services = model.$getServices();

        for (let service in services) {
          if (services[service].apiType === API_TYPES.REST)
            continue;

          socket.on(services[service].event, Context.Socket(ns, socket, model, services[service]));
        }
      }
    }

    socket.on('disconnect', () => {
      if ('onDisconnect' in app)
        (<any>app).onDisconnect(socket, ns);

      io.emit('user disconnected');
      socket.disconnect();
    });
  });
}