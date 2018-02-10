import { Context } from '../context';
import { MongoModel } from '../models/mongo-model';
export declare const hooks: (((ctx: Context, model: MongoModel, field: string) => void) | ((ctx: Context, fields: string | string[], source?: string | undefined) => void))[];
