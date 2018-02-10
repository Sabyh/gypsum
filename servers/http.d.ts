/// <reference types="@types/node" />
import * as express from 'express';
import * as http from 'http';
export declare class Server {
    app: express.Express;
    server: http.Server;
    io: any;
    start(port: number): void;
}