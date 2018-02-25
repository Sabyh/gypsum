import * as path from 'path';
import { MongoClientOptions } from 'mongodb';
import { ILoggerOptions } from './misc/logger';

// Server Configurations Interface
export interface IServerConfigOptions {
  server_name: string;
  secure: boolean;
  origin: string;
  port: number;
  host: string;
  services_prefix: string;
  statics: string[];
  files_data_dir: string;
  processes: number | 'max';
  cookie_key: string;
  upload_size_limit_mb: number;
  logger_options: ILoggerOptions | null;
  mongodb_url: string;
  database_name: string;
  spa: string;
  authenticationModelName: string;
  authorizationModelName: string;
}

export type IServerConfig = {
  [key in keyof IServerConfigOptions]?: IServerConfigOptions[key];
}

export interface IApp {
  name: string;
  database?: string;
  subdomain?: boolean;
  secure?: boolean;
  spa?: string;
}

export interface IConfig {
  server?: IServerConfig;
  apps?: IApp[];
}

export interface IGypsumConfig {
  dev: IConfig;
  prod: IConfig;
}

export interface IGypsumConfigurations {
  dev?: IConfig,
  prod?: IConfig
}

export const Config: IGypsumConfig = {
  dev: {
    server: {
      server_name: 'gypsum',
      secure: false,
      origin: "http://localhost:7771",
      port: 7771,
      host: "localhost",
      services_prefix: "apis",
      statics: ['static'],
      files_data_dir: ".data",
      processes: 1,
      cookie_key: 'kdu8v9qwem8hqe',
      upload_size_limit_mb: 10,
      logger_options: { all: 'debug' },
      mongodb_url: 'mongodb://localhost:27017',
      database_name: 'gypsum_dev_db',
      spa: '',
      authenticationModelName: '',
      authorizationModelName: ''
    }
  },

  prod: {
    server: {
      secure: true,
      origin: "http://localhost",
      processes: 'max',
      logger_options: { all: "error" },
      database_name: 'gypsum_db'
    }
  }
}
