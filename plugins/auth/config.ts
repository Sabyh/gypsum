import * as path from 'path';
import { MongoModel } from '../../models';

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
  usersModelConstructor: typeof MongoModel;
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
  authorization: boolean;
}

export type IAuthenticationConfig = {
  [key in keyof IAuthenticationConfigOptions]?: IAuthenticationConfigOptions[key];
}

export const defaultConfig = {
  rootUser: 'root',
  rootUserEmail: 'root@admin.com',
  rootUserPassword: 'admin',
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
  activationMailTemplatePath: path.join(__dirname, '../templates/activation-email-template.html'),
  authorization: false
}