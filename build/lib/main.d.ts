import * as Types from './types';
import { IGypsumConfigurations } from './config';
import { IMiddlewares } from './state';
import { Model } from './model/model';
import { FileModel } from './model/file-model';
import { MongoModel } from './model/mongo-model';
import { Context } from './context';
import { SERVICE, HOOK, MODEL } from './decorators';
export declare namespace Gypsum {
    interface IGypsumUseOptions {
        models?: typeof Model[];
        middlewares?: IMiddlewares;
        hooks?: ((ctx: Context, ...args: any[]) => void)[];
    }
}
export declare const Gypsum: {
    root: string;
    env: string;
    dev: boolean;
    get(name: "host" | "rootUser" | "rootUserEmail" | "rootPassword" | "usersModel" | "userEmailField" | "userIdField" | "usernameField" | "passwordField" | "passwordSaltField" | "userIsActiveField" | "tokenFieldName" | "tokenSecret" | "usernamePattern" | "passwordpattern" | "tranporterOptions" | "activationMailFrom" | "activationMailSubject" | "activationMailTemplatePath" | "activationPage" | "server_name" | "origin" | "port" | "services_prefix" | "static_dir" | "static_prefix" | "files_data_dir" | "mongodb_url" | "mongo_database_name" | "processes" | "cookie_key" | "upload_size_limit_mb" | "logger_options" | "authentication" | "authorization"): any;
    configure(userConfig?: IGypsumConfigurations): any;
    use(options: Gypsum.IGypsumUseOptions): any;
    bootstrap(): void;
};
export { Model, MongoModel, FileModel, MODEL, SERVICE, HOOK, Context, Types };
