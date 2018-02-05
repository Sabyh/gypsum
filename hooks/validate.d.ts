import * as Validall from 'validall';
import { Context } from '../context';
export declare function validate(ctx: Context, args: {
    [key: string]: Validall.ISchema;
}): void;
