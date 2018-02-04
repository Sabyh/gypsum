export interface IEmailTransporter {
    pool?: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    service?: string;
    auth: {
        user: string;
        pass: string;
    };
}
export interface IAuthenticationConfig {
    rootUser?: string;
    rootUserEmail?: string;
    rootPassword?: string;
    usersModel?: string;
    userEmailField?: string;
    userIdField?: string;
    usernameField?: string;
    passwordField?: string;
    passwordSaltField?: string;
    userIsActiveField?: string;
    tokenFieldName?: string;
    tokenSecret?: string;
    usernamePattern?: string;
    passwordpattern?: string;
    tranporterOptions?: IEmailTransporter | null;
    activationMailFrom?: string;
    activationMailSubject?: string;
    activationMailTemplatePath?: string;
    activationPage?: string;
}
export declare const AuthenticationConfig: IAuthenticationConfig;
