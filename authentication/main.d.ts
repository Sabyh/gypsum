import { Model, MongoModel } from '../models';
import { Context } from '../context';
export declare class Authentication extends Model {
    userModel: MongoModel;
    transporter: any;
    constructor();
    getRootUser(): Promise<any>;
    createRootUser(): Promise<any>;
    pushToken(ctx: Context): void;
    secure(ctx: Context): void;
    activationEmail(ctx: Context): void;
    sendActivationEmail(ctx: Context): void;
    activateUser(ctx: Context): void;
    signin(ctx: Context): void;
    signup(ctx: Context): void;
}
