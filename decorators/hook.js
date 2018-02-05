"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function HOOK(options = { private: false }) {
    return function (target, key, descriptor) {
        descriptor.value.isHook = true;
        descriptor.value.private = options.private;
        descriptor.enumerable = true;
        descriptor.configurable = true;
        return descriptor;
    };
}
exports.HOOK = HOOK;
//# sourceMappingURL=hook.js.map