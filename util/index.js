"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./array"));
__export(require("./crypt"));
__export(require("./object"));
__export(require("./string"));
function is(arg, key) {
    return arg[key] !== undefined;
}
exports.is = is;
function range(start, end, step) {
    let result = [];
    if ((start !== 0 && !start) || (end !== 0 && !end))
        return result;
    step = step || 1;
    step = Math.abs(step);
    step = start < end ? step : step *= -1;
    let counter = start;
    while (true) {
        result.push(counter);
        counter += step;
        if ((step < 0 && counter < end) || (step > 0 && counter > end))
            break;
    }
    return result;
}
exports.range = range;
function random(length = 16, type = 'letters capitals numbers') {
    let code = '';
    let characters = {
        letters: 'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z'.split(','),
        capitals: 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z'.split(','),
        numbers: '1,2,3,4,5,6,7,8,9,0'.split(',')
    };
    let collection = type.split(' ').reduce(function (prev, curr) {
        return prev.concat(characters[curr]);
    }, []);
    for (let i = 0; i < length; i++) {
        let index = Math.floor(Math.random() * collection.length);
        code += collection[index];
    }
    return code;
}
exports.random = random;
function toRegExp(pattern) {
    let parts;
    let flags;
    if (pattern.charAt(0) === '/') {
        parts = decodeURI(pattern).split('/');
        flags = parts.pop();
        pattern = parts.join('/').replace(/^\/|\/$/g, '');
    }
    return new RegExp(pattern, flags);
}
exports.toRegExp = toRegExp;
//# sourceMappingURL=index.js.map