import * as path from 'path';
import { CorsOptions } from 'cors';
import { MongoClientOptions } from 'mongodb';
import { ILoggerOptions } from './misc/logger';

export interface IApp {
  name: string;
  mongodb_url?: string;
  database_name?: string;
  subdomain?: boolean;
  secure?: boolean;
  cors?: CorsOptions;
  spa?: string;
}

// Server Configurations Interface
export interface IServerConfigOptions {
  server_name: string;
  origin: string;
  port: number;
  host: string;
  secure: boolean;
  mongodb_url: string;
  database_name: string;
  cors?: CorsOptions;
  services_prefix: string;
  statics: string[];
  spa: string;
  files_data_dir: string;
  processes: number | 'max';
  cookie_key: string;
  upload_size_limit_mb: number;
  logger_options: ILoggerOptions | null;
  logger_out_dir: string;
  authenticationModelName: string;
  authorizationModelName: string;
  apps: IApp[];
}

export type IServerConfig = {
  [key in keyof IServerConfigOptions]?: IServerConfigOptions[key];
}

export interface IConfig {
  server?: IServerConfig;
  apps?: IApp[];
}

export interface IGypsumConfig {
  dev: IServerConfig;
  prod: IServerConfig;
}

export interface IGypsumConfigurations {
  dev?: IServerConfig,
  prod?: IServerConfig
}

export const Config: IGypsumConfig = {
  dev: {
    server_name: 'gypsum',
    origin: "http://localhost:7771",
    port: 7771,
    host: "localhost",
    secure: false,
    mongodb_url: "mongodb://localhost:27017",
    database_name: 'gypsum_dev_db',
    services_prefix: "apis",
    statics: ['static'],
    spa: 'public',
    files_data_dir: ".data",
    processes: 1,
    cookie_key: 'kdu8v9qwem8hqe',
    upload_size_limit_mb: 10,
    logger_options: { all: { level: ['debug'] } },
    logger_out_dir: 'logs',
    authenticationModelName: '',
    authorizationModelName: '',
    cors: {
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204
    },
    apps: [{
      name: 'default',
      subdomain: false
    }]
  },

  prod: {
    origin: "https://localhost",
    mongodb_url: "mongodb://localhost:27017",
    database_name: 'gypsum_db',
    secure: true,
    processes: 'max',
    logger_options: { all: { level: ['warn'] } },
    apps: [{
      name: 'default',
      subdomain: false,
      spa: 'public'
    }]
  }
}
