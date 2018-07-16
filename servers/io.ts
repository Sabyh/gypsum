import { State } from '../state';
import { Context } from '../context';
import { Model } from '../models';
import { Response, API_TYPES, RESPONSE_DOMAINS } from '../types';
import { Logger } from '../misc/logger';
import { App } from '../app';

export function initSocket(io: any) {

  io.use((socket: any, next: Function) => {

    if (socket.handshake.query && socket.handshake.query.app) {
      let namespace = socket.handshake.query.app;
      let appName = namespace.split('/')[0];

      let app = State.apps.find(_app => _app.name === appName);

      if (app) {
        if ('onHandShake' in app)
          (<any>app).onHandShake(socket, namespace, next);
        else
          next();

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
        let namespace = `${State.apps[i].name.toLowerCase()}/${appNamespaces[i].toLowerCase()}`;
        let ns = io.of(namespace);
        State.ioNamespaces[namespace] = ns;
        initializeApp(ns, State.apps[i], namespace);
      }
    }
  }

  process.on('message', msg => {
    if (msg.data && msg.action === 'response') {
      let response: Response = msg.data;
      let namespace = msg.namespace;

      if (State.ioNamespaces[namespace]) {
        if ((response.domain === RESPONSE_DOMAINS.ROOM) && response.room) {
          State.ioNamespaces[namespace].to(response.room).emit(response.crud, response);
        } else if (response.domain === RESPONSE_DOMAINS.ALL) {
          State.ioNamespaces[namespace].emit(response.crud, response);
        }
      }
    } else if (msg.data && (msg.action === 'join room' || msg.action === 'leave room')) {
      let rooms = msg.data.rooms;
      let socketIds = msg.data.socketIds;
      let ns = State.ioNamespaces[msg.namespace];
      let action = msg.action === 'join room' ? 'join' : 'leave';

      if (ns && rooms && socketIds && socketIds.length) {
        let nsSockets = ns.sockets;
        for (let i = 0; i < socketIds.length; i++) {
          if (nsSockets[socketIds[i]]) {
            for (let room of rooms)
              nsSockets[socketIds[i]][action](room);
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

    logger.info(`socket connected: { socketId: ${socket.id}, pid: ${process.pid}, namespace: ${ns} }`);

    logger.info('Implementing socket web services');

    let appModels = app.publicModels;
    if (appModels && appModels.length) {

      for (let i = 0; i < appModels.length; i++) {
        let model: Model = appModels![i];

        if (model.$get('apiType') === API_TYPES.REST)
          continue;

        let services = model.$getServices();

        for (let service in services) {
          if (services[service].apiType === API_TYPES.REST)
            continue;

          logger.info(`app ${ns} is listening on '${services[service].event}' event`);
          socket.on(services[service].event, Context.Socket(app.name, ns, socket, model, services[service]));
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