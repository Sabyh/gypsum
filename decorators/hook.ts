import TB from 'tools-box';
import { Context } from "../context";
import { ResponseError } from "../types";

export interface IHook {
  (ctx: Context, ...args: any[]): void;
}

export interface IModelHook extends IHook {
  __name: string;
  isHook: boolean;
  private: boolean;
}

export type IHookOptions = string | { name: string, args?: any }

export function HOOK(options: { private: boolean } = { private: false }) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let hookName = TB.capitalizeFirst(key);

    function hook(ctx: Context, ...args: any[]) {
      args.push(ctx);
      this[key](...args)
        .then(() => {
          ctx.next()
        })
        .catch((error: ResponseError) => ctx.next(error));
    }

    (<any>hook).__name = hookName;
    (<IModelHook>hook).isHook = true;
    (<IModelHook>hook).private = options.private;

    Object.defineProperty(target.constructor.prototype, hookName, {
      value: hook,
      enumerable: true
    });
  }
}