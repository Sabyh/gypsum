import * as express from 'express';
import * as http from 'http';
import * as socketIO from 'socket.io';

export class Server {
  app: express.Express = express();
  server: http.Server = http.createServer(this.app);
  io: SocketIO.Server = socketIO(this.server);

  start(port: number) {
    this.server.listen(port);
    console.log('listening on port: ', port);
  }
}