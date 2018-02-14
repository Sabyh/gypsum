import { MongoClientOptions } from 'mongodb';
import { ILoggerOptions } from './misc/logger';
export interface IEmailTransporter {
    pool: boolean;
    host: string;
    port: number;
    secure: boolean;
    service: string;
    auth: {
        user: string;
        pass: string;
    };
}
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
export declare type IAuthenticationConfig = {
    [key in keyof IAuthenticationConfigOptions]?: IAuthenticationConfigOptions[key];
};
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
export declare type IServerConfig = {
    [key in keyof IServerConfigOptions]?: IServerConfigOptions[key];
};
export interface IDatabaseConnection {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    databases?: {
        name: string;
        app?: string;
        options?: MongoClientOptions;
    }[];
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
    dev?: IConfig;
    prod?: IConfig;
}
export declare const Config: IGypsumConfig;
