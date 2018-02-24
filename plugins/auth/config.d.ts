import { MongoModel } from '../../models';
export interface IEmailTransporter {
    pool?: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    service?: string;
    auth?: {
        user: string;
        pass: string;
    };
}
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
export declare type IAuthenticationConfig = {
    [key in keyof IAuthenticationConfigOptions]?: IAuthenticationConfigOptions[key];
};
export declare const defaultConfig: {
    rootUser: string;
    rootUserEmail: string;
    rootUserPassword: string;
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
    tranporterOptions: null;
    activationMailFrom: string;
    activationMailSubject: string;
    activationPage: string;
    activationMailTemplatePath: string;
    authorization: boolean;
};
