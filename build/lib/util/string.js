"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringUtil = {
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    splice(src, start, deleteCount, insertion = "") {
        if (deleteCount === undefined) {
            deleteCount = start;
            start = 0;
            return src.slice(start, deleteCount);
        }
        let end = (start + deleteCount) > src.length ? src.length : start + deleteCount;
        return src.slice(0, start) + insertion + src.slice(end, src.length);
    },
    cleanPath(path) {
        if (!path)
            return "";
        path = path.trim()
            .replace(/^\/|\/$/g, "")
            .replace(/:\/\//, '%')
            .replace(/\/{2,}/g, "/")
            .replace('%', '://')
            .replace(/(\w+)\/\.\./g, "$1");
        return path;
    },
    getFileExtension(fileName) {
        if (!fileName || fileName.indexOf(".") < 0)
            return "";
        return fileName.slice(fileName.lastIndexOf(".") + 1);
    },
    compile(template, data) {
        let reg = /\{\{\s*([\w\.]+)\s*\}\}/g;
        return template.replace(reg, (match, $1) => {
            let parts = $1.split("."), temp;
            match = match;
            if (parts.length == 1)
                return data[parts[0]] || "";
            temp = data[parts[0]];
            for (let i = 1; i < parts.length; i++) {
                temp = temp[parts[i]];
            }
            return temp || "";
        });
    },
    readTime(timeStr) {
        let time = 0;
        let parts = timeStr.split(' ');
        let map = { y: 217728000, o: 18144000, w: 604800, d: 86400, h: 3600, m: 60, s: 1 };
        parts.forEach(function (part) {
            if (!part.length)
                return time += 0;
            let amount = part.slice(0, -1), unit = part.slice(-1);
            time += map[unit] * parseInt(amount, 10);
        });
        return time * 1000;
    }
};
//# sourceMappingURL=string.js.map