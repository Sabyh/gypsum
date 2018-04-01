import * as express from 'express';
import * as http from 'http';
import * as IO from 'socket.io';
import { State } from '../state';
import { Logger } from '../misc/logger';

export class Server {
  app: express.Express = express();
  server: http.Server = http.createServer(this.app);
  io: any = IO(this.server);

  start() {
    this.server.listen(State.config.port);
    Logger.Info(`${State.config.server_name} is running on port: ${State.config.port}, pid: ${process.pid}`);
  }
}