"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const symbols = {};
const grantListStatus = {
    mongo: false,
    state: false,
    context: false,
    model: false,
    ioServer: false,
    mongoModel: false,
    fileModel: false,
    main: false
};
class Safe {
    constructor(name) {
        if (!grantListStatus.hasOwnProperty(name))
            throw new Error(`${name} module is not granted an access the safe`);
        if (grantListStatus[name] === true)
            throw new Error(`${name} already accessed the safe`);
        this.name = name;
        grantListStatus[name] = true;
    }
    get(item) {
        if (!symbols.hasOwnProperty(item))
            throw new Error(`${item} does not exists in safe`);
        if (symbols[item].friends.indexOf(this.name) > -1)
            return symbols[item].value;
        throw new Error(`${this.name} is no friend for: ${symbols[item].owner}`);
    }
    set(item, friends) {
        symbols[item] = { value: Symbol(), friends, owner: this.name };
        return symbols[item].value;
    }
}
exports.Safe = Safe;
//# sourceMappingURL=safe.js.map