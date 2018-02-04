"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function FRIEND(symbol, get = true, set = false) {
    return function (target, key, descriptor) {
        if (symbol) {
            if (!descriptor) {
                let getter = !get ? undefined : function () { return this[key]; };
                let setter = !set ? undefined : function (value) { this[key] = value; };
                Object.defineProperty(target.constructor.prototype, symbol, {
                    get: getter,
                    set: setter,
                    enumerable: false,
                    configurable: false
                });
            }
            else {
                target.constructor.prototype[symbol] = descriptor.value;
            }
        }
    };
}
exports.FRIEND = FRIEND;
//# sourceMappingURL=friend.js.map