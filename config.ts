import * as path from 'path';
import { MongoClientOptions } from 'mongodb';
import { ILoggerOptions } from './misc/logger';

// Email Transporter Interface
export interface IEmailTransporter {
  pool: boolean;
  host: string;
  port: number;
  secure: boolean;
  service: string;
  auth: { user: string; pass: string };
}

// Authentication Configurations Interface
export interface IAuthenticationConfigOptions {
  rootUser: string;
  rootUserEmail: string;
  rootPassword: string;
  usersModel: string;
  userEmailField: string;
  userIdField: string;
  usernameField: string;
  passwordField: string;
  passwordSaltField: string;
  userIsActiveField: string;
  tokenFieldName: string;
  tokenSecret: string;
  usernamePattern: string;
  passwordpattern: string;
  tranporterOptions: IEmailTransporter | null;
  activationMailFrom: string;
  activationMailSubject: string;
  activationMailTemplatePath: string;
  activationPage: string;
}

export type IAuthenticationConfig = {
  [key in keyof IAuthenticationConfigOptions]?: IAuthenticationConfigOptions[key];
}

// Server Configurations Interface
export interface IServerConfigOptions {
  server_name: string;
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
  authentication: boolean;
  authorization: boolean;
}

export type IServerConfig = {
  [key in keyof IServerConfigOptions]?: IServerConfigOptions[key];
}

export interface IDatabaseConnection {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  databases?: { name: string; app?: string; options?: MongoClientOptions; }[];
}

export interface IConfig {
  authConfig?: IAuthenticationConfig;
  server?: IServerConfig;
  database?: IDatabaseConnection;
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
    authConfig: {
      rootUser: 'root',
      rootUserEmail: 'root@admin.com',
      rootPassword: 'admin',
      usersModel: 'Users',
      userEmailField: 'email',
      userIdField: 'userid',
      usernameField: 'username',
      passwordField: 'password',
      passwordSaltField: 'passwordSalt',
      userIsActiveField: 'isActive',
      tokenFieldName: 'token',
      tokenSecret: '4s8e1doenf3q2d6q2x4fv12',
      usernamePattern: '/[a-zA-Z0-9_]{5,}/',
      passwordpattern: '/[a-zA-Z0-9_]{5,}/',
      tranporterOptions: null,
      activationMailFrom: 'me@threre.com',
      activationMailSubject: 'Activation Email',
      activationPage: path.join(__dirname, '../templates/activation-page-template.html'),
      activationMailTemplatePath: path.join(__dirname, '../templates/activation-email-template.html')
    },
    server: {
      server_name: 'gypsum',
      origin: "http://localhost",
      port: 7771,
      host: "http://localhost:7771",
      services_prefix: "apis",
      statics: ['static'],
      files_data_dir: ".data",
      processes: 1,
      cookie_key: 'kdu8v9qwem8hqe',
      upload_size_limit_mb: 10,
      logger_options: { all: 'debug' },
      authentication: false,
      authorization: false
    },
    database: {
      host: 'localhost',
      port: 27017,
      databases: [{ name: 'gypsum_dev_db'}]
    }
  },

  prod: {
    server: {
      origin: "http://localhost",
      processes: 'max',
      logger_options: { all: "error" }
    },
    database: {
      databases: [{ name: 'gypsum_db' }]
    }
  }
}
