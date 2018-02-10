import { MongoModel } from '../models/mongo-model';
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
