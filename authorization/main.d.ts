import { Collection } from 'mongodb';
import { Model } from '../models/model';
import { Context } from '../context';
export declare namespace Authorization {
    interface IAuthorizeOption {
        roles?: string | string[];
        groups?: string | string[];
        fields?: string | string[];
    }
}
export declare class Authorization extends Model {
    roles: Collection;
    groups: Collection;
    private _mGetUserRolesFromGroups(id);
    private _mGetUserPermissionsFromRules(id, extraRules?);
    authorize(ctx: Context, options: boolean | string[]): void;
}
