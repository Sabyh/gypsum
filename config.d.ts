import { ILoggerOptions } from './misc/logger';
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
    spa: string;
}
export declare type IServerConfig = {
    [key in keyof IServerConfigOptions]?: IServerConfigOptions[key];
};
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
    dev?: IConfig;
    prod?: IConfig;
}
export declare const Config: IGypsumConfig;
