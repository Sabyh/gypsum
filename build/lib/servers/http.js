"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const IO = require("socket.io");
class Server {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = IO(this.server);
    }
    start(port) {
        this.server.listen(port);
        console.log('listening on port: ', port);
    }
}
exports.Server = Server;
//# sourceMappingURL=http.js.map