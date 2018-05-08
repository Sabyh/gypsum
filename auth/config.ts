import { CorsOptions } from 'cors';
import { TransportOptions } from 'nodemailer';

export interface IEmailTransporter {
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  auth: {
    user: string;
    password: string;
  }
}

export interface IAuthConfig {
  mongodb_url?: string;
  cors?: CorsOptions;
  namespaces?: string[];
  transporter?: IEmailTransporter;
  rootUserEmail?: string;
  rootUserPassword?: string;
  verificationEmailExpiry?: number;
  tokenExpiry?: number;
  supportEmail?: string;
}

export interface IAuthEnvConfig {
  dev: IAuthConfig;
  prod?: IAuthConfig;
}

export const defaultAuthConfig: IAuthConfig = {
  mongodb_url: 'mongodb://localhost:27017',
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  },
  namespaces: [],
  transporter: null,
  rootUserEmail: 'root@gypsum.com',
  rootUserPassword: 'g56648e1845tg565g3s',
  verificationEmailExpiry: 60 * 60,
  tokenExpiry: 60 * 60 * 24 * 7
}