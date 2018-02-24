"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
function HOOK(options = { private: false }) {
    return function (target, key, descriptor) {
        let hookName = util_1.stringUtil.capitalizeFirst(key);
        function hook(ctx, ...args) {
            args.push(ctx);
            this[key](...args)
                .then(() => ctx.next())
                .catch((error) => ctx.next(error));
        }
        hook.__name = hookName;
        hook.isHook = true;
        hook.private = options.private;
        Object.defineProperty(target.constructor.prototype, hookName, {
            value: hook,
            enumerable: true
        });
    };
}
exports.HOOK = HOOK;
//# sourceMappingURL=hook.js.map