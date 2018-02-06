export const stringUtil = {
  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  splice(src: string, start: number, deleteCount?: number, insertion: string = ""): string {
    if (deleteCount === undefined) {
      deleteCount = start;
      start = 0;
      return src.slice(start, deleteCount);
    }

    let end = (start + deleteCount) > src.length ? src.length : start + deleteCount;
    return src.slice(0, start) + insertion + src.slice(end, src.length);

  },

  cleanPath(path: string): string {
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

  getFileExtension(fileName: string): string {
    if (!fileName || fileName.indexOf(".") < 0) return "";
    return fileName.slice(fileName.lastIndexOf(".") + 1);
  },

  compile(template: string, data: { [key: string]: any }): string {
    let reg = /\{\{\s*([\w\.]+)\s*\}\}/g;

    return template.replace(reg, (match: string, $1: string): string => {
      let parts = $1.split("."), temp: any;
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

  readTime(timeStr: string): number {
    let time = 0;
    let parts = timeStr.split(' ');
    let map: {[key: string]: number} = { y: 217728000, o: 18144000, w: 604800, d: 86400, h: 3600, m: 60, s: 1 };

    parts.forEach(function (part) {
      if (!part.length) return time += 0;

      let amount = part.slice(0, -1),
        unit = part.slice(-1);

      time += map[unit] * parseInt(amount, 10);
    });

    return time * 1000;
  }
}