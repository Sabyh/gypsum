import { IAuthenticationConfigOptions } from './config';
export declare namespace Authorization {
    interface IAuthorizeOption {
        roles?: string | string[];
        groups?: string | string[];
        fields?: string | string[];
    }
}
export interface IPermission {
    model: string;
    services: string[];
}
export declare function initAuthorization(authConfig: IAuthenticationConfigOptions): void;
