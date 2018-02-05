"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
function hash(src, salt) {
    const len = 64;
    const iterations = 10000;
    const digest = 'sha256';
    return new Promise((resolve, reject) => {
        if (salt) {
            crypto.pbkdf2(src, salt, iterations, len, digest, (err, derivedKey) => {
                if (err)
                    return reject(err);
                resolve(derivedKey.toString('base64'));
            });
        }
        else {
            crypto.randomBytes(16, (err, saltBuffer) => {
                if (err)
                    return reject(err);
                salt = saltBuffer.toString('base64');
                crypto.pbkdf2(src, salt, iterations, len, digest, (err, derivedKey) => {
                    if (err)
                        return reject(err);
                    resolve([derivedKey.toString('base64'), salt]);
                });
            });
        }
    });
}
exports.hash = hash;
function verify(src, hashed, salt) {
    return new Promise((resolve, reject) => {
        hash(src, salt)
            .then(hashedSrc => {
            resolve(hashedSrc === hashed);
        })
            .catch(err => reject(err));
    });
}
exports.verify = verify;
//# sourceMappingURL=crypt.js.map