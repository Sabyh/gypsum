import { CorsOptions } from 'cors';

export interface IEmailTransporter {}

export interface IAuthConfig {
  mongodb_url?: string;
  cors?: CorsOptions;
  namespaces?: string[];
  transporter?: IEmailTransporter;
  rootUserEmail?: string;
  rootUserPassword?: string;
  verificationEmailExpiry?: number;
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
  verificationEmailExpiry: 60 * 60
}