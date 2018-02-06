export function FRIEND(symbol: Symbol, get: boolean = true, set: boolean = false) {
  return function (target: any, key: string, descriptor?: PropertyDescriptor) {
    if (symbol) {
      if (!descriptor) {
        let getter = !get ? undefined : function () { return this[key]; };
        let setter = !set ? undefined : function (value: any) { this[key] = value; };

        Object.defineProperty(target.constructor.prototype, <any>symbol, {
          get: getter,
          set: setter,
          enumerable: false,
          configurable: false
        });
      } else {
        target.constructor.prototype[<any>symbol] = descriptor.value;
      }
    }
  }
}