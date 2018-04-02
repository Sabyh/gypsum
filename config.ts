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
  port: number;
  hostName: string;
  secure: boolean;
  statics: string[];
  spa: string;
  files_data_dir: string;
  processes: number | 'max';
  cookie_key: string;
  upload_size_limit_mb: number;
  logger_options: ILoggerOptions | null;
  logger_out_dir: string;
  authenticationModelPath: string;
  authorizationModelPath: string;
}

export type IServerConfig = {
  [key in keyof IServerConfigOptions]?: IServerConfigOptions[key];
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
    hostName: "localhost",
    server_name: 'gypsum',
    port: 7771,
    secure: false,
    statics: ['static'],
    files_data_dir: ".data",
    processes: 1,
    cookie_key: 'kdu8v9qwem8hqe',
    upload_size_limit_mb: 10,
    logger_options: { all: { level: ['all'] } },
    authenticationModelPath: '',
    authorizationModelPath: '',
  },

  prod: {
    secure: true,
    processes: 'max',
    logger_options: { all: { level: ['error', 'warn'] } }
  }
}
