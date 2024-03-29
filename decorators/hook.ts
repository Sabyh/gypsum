import { capitalizeFirst } from 'tools-box/string';
import { Context } from "../context";
import { ResponseError } from "../types";

export interface IHookFunc {
  (ctx: Context, ...args: any[]): void;
}

export interface IHook extends IHookFunc {
  __name: string;
  isHook: boolean;
  private: boolean;
}

export type IHookOptions = string | { name: string, args?: any }

export function HOOK(options: { private: boolean } = { private: false }) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let hookName = capitalizeFirst(key);

    function hook(ctx: Context, ...args: any[]) {
      args.push(ctx);
      this[key](...args)
        .then(() => {
          ctx.next()
        })
        .catch((error: ResponseError) => ctx.next(error));
    }

    (<any>hook).__name = hookName;
    (<IHook>hook).isHook = true;
    (<IHook>hook).private = options.private;

    Object.defineProperty(target.constructor.prototype, hookName, {
      value: hook,
      enumerable: true
    });
  }
}