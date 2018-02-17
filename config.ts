import * as path from 'path';
import { MongoClientOptions } from 'mongodb';
import { ILoggerOptions } from './misc/logger';

// Email Transporter Interface
export interface IEmailTransporter {
  pool?: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  auth?: { user: string; pass: string };
}

// Authentication Configurations Interface
export interface IAuthenticationConfigOptions {
  rootUser: string;
  rootUserEmail: string;
  rootUserPassword: string;
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
  authentication: boolean;
  authorization: boolean;
  mongodb_url: string;
  database_name: string;
}

export type IServerConfig = {
  [key in keyof IServerConfigOptions]?: IServerConfigOptions[key];
}

export interface IApp {
  name: string;
  database?: string;
  subdomain?: boolean;
  secure?: boolean;
}

export interface IConfig {
  authConfig?: IAuthenticationConfig;
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
    authConfig: {
      rootUser: 'root',
      rootUserEmail: 'root@admin.com',
      rootUserPassword: 'admin',
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
      activationMailSubject: 'Gypsum Activation Email',
      activationPage: path.join(__dirname, '../templates/activation-page-template.html'),
      activationMailTemplatePath: path.join(__dirname, '../templates/activation-email-template.html')
    },
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
      authentication: false,
      authorization: false,
      mongodb_url: 'mongodb://localhost:27017',
      database_name: 'gypsum_dev_db'
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
