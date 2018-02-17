"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const IO = require("socket.io");
const state_1 = require("../state");
class Server {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = IO(this.server);
    }
    start() {
        this.server.listen(state_1.State.config.port);
        console.log(`${state_1.State.config.server_name} is running on port: ${state_1.State.config.port}, pid: ${process.pid}`);
    }
}
exports.Server = Server;
//# sourceMappingURL=http.js.map