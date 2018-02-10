import { MongoModel } from '../models';
export interface IPermission {
    model: string;
    services: string[];
}
export declare class AuthRoles extends MongoModel {
    authenticationModel: MongoModel;
    private _mCreateRootRole(user);
    private _mInsertRootRole(role);
    constructor();
    onCollection(): void;
}
