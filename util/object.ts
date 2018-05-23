import { Types } from 'validall';

export interface IObject {
  [key: string]: any;
}

export const objectUtil = {

  isObject(obj: any): boolean {
    return Object.prototype.toString.call(obj) === "[object Object]";
  },

  desc(obj: IObject, indent: number): void {
    if (typeof obj !== "object")
      console.log(obj);
    else
      console.log(JSON.stringify(obj, null, indent || 2));
  },

  size(obj: IObject): number {
    if (Object.keys)
      return Object.keys(obj).length;

    let count = 0;

    for (let prop in obj)
      if (obj.hasOwnProperty(prop))
        count += 1;

    return count;
  },

  extend(dest: any, src: any, overwrite: boolean = true): any {
    if (Array.isArray(src)) {
      dest = dest || [];
      for (let i = 0; i < src.length; i++) {
        if (Object.prototype.toString.call(src[i]) === "[object Object]") {
          if ((Object.prototype.toString.call(dest[i]) !== "[object Object]" && overwrite) || dest[i] === undefined) {
            dest[i] = {};
            this.extend(dest[i], src[i], overwrite);
          } else if (Object.prototype.toString.call(dest[i]) === "[object Object]") {
            this.extend(dest[i], src[i], overwrite);
          }
          
        } else if (Array.isArray(src[i])) {
          if ((!Array.isArray(src[i]) && overwrite) || dest[i] === undefined) {
            dest[i] = [];
            this.extend(dest[i], src[i], overwrite);
          } else if (Array.isArray(src[i])) {
            this.extend(dest[i], src[i], overwrite);
          }
          
        } else if (dest[i] === undefined || overwrite) {
          dest[i] = src[i];
        }
      }
    } else {
      dest = dest || {};
      for (let prop in src) {
        if (src.hasOwnProperty(prop)) {
          if (Object.prototype.toString.call(src[prop]) === "[object Object]") {
            if ((Object.prototype.toString.call(dest[prop]) !== "[object Object]" && overwrite) || dest[prop] === undefined) {
              dest[prop] = <any>{};
              this.extend(dest[prop], src[prop], overwrite);
              
            } else if (Object.prototype.toString.call(dest[prop]) === "[object Object]") {
              this.extend(dest[prop], src[prop], overwrite);
            }
            
          } else if (Array.isArray(src[prop])) {
            if ((!Array.isArray(src[prop]) && overwrite) || dest[prop] === undefined) {
              dest[prop] = <any>[];
              this.extend(dest[prop], src[prop], overwrite);
              
            } else if (Array.isArray(src[prop])) {
              this.extend(dest[prop], src[prop], overwrite);
            }
            
          } else if (dest[prop] === undefined || overwrite) {
            dest[prop] = src[prop];
          }
        }
      }
    }
  
    return dest;
  },

  fromPath(obj: IObject, path: string, value: any, inject: boolean) {
    let parts = path.split('.');

    if (parts.length === 1) {
      if (value === undefined) {
        return parts[0] ? obj[parts[0]] : obj;
      } else if (inject) {
        return obj[parts[0]] = value;
      } else if (obj.hasOwnProperty(parts[0])) {
        return obj[parts[0]] = value;
      } else {
        return false;
      }
    }

    let temp: any = obj;

    for (let j = 0; j < parts.length; j++) {
      if (parts[j] === '$') {
        temp = Array.isArray(temp) ? temp : undefined;
        if (temp) {
          let result = [];
          for (let i = 0; i < (temp.length || 1); i++) {
            temp[i] = temp[i] || {};
            let currentValue = Array.isArray(value) ? value[i] : value;
            result.push(this.fromPath(temp[i], parts.slice(j + 1).join('.'), currentValue, inject));
          }

          return result;
        } else {
          return false;
        }
      }

      if (temp[parts[j]]) {
        temp = temp[parts[j]];

        if (j === parts.length - 2 && value !== undefined) {
          if (inject || temp.hasOwnProperty(parts[j + 1]))
            return !!(temp[parts[j + 1]] = value);
          else
            return undefined;

        }

        if (j === parts.length - 1)
          return temp;

      } else if (inject) {
        if (parts[j + 1] && parts[j + 1] === '$' && inject) {
          temp[parts[j--]] = [];
        } else {
          temp[parts[j--]] = {};
        }
      } else {
        return undefined;
      }
    }
  },

  getValue(obj: IObject, path: string) { return this.fromPath(obj, path); },
  setValue(obj: IObject, path: string, value: any) { return this.fromPath(obj, path, value); },
  injectValue(obj: IObject, path: string, value: any) { return this.fromPath(obj, path, value, true); },

  hasProperty(src: any, path: string): boolean {
    let parts = path.split('.');

    if (parts.length === 1)
      return src.hasOwnProperty(path);

    let temp = src;

    for (let i = 0; i < parts.length; i++) {
      if (!temp.hasOwnProperty(parts[i]))
        return false;

      temp = temp[parts[i]];
    }

    return true;
  },

  equals(arg1: any, arg2: any, deep: boolean): boolean {
    if (arg1 instanceof Array && arg2 instanceof Array) {
      if (arg1.length !== arg2.length) return false;
      for (let i = 0; i < arg1.length; i++) {
        let pass = false;
        for (let j = 0; j < arg2.length; j++) {
          if ((deep && this.equals(arg1[i], arg2[j])) || (!deep && arg1[i] === arg2[j])) {
            if (this.equals(arg1[i], arg2[j])) {
              pass = true;
              break;
            }
          }
        }
        if (!pass) return false;
      }
      return true;
    } else if (arg1 instanceof Date && arg2 instanceof Date) {
      return arg1.toDateString() === arg2.toDateString();
    } else if (arg1 instanceof RegExp && arg2 instanceof RegExp) {
      return arg1.toString() === arg2.toString();
    } else if (arg1 instanceof Object && arg2 instanceof Object) {
      if (Object.keys(arg1).length !== Object.keys(arg2).length) return false;
      for (let prop1 in arg1) {
        if (arg1.hasOwnProperty(prop1)) {
          let pass = false;
          for (let prop2 in arg2) {
            if (arg2.hasOwnProperty(prop1)) {
              if ((deep && this.equals(arg1[prop1], arg2[prop2])) || (!deep && arg1[prop1] === arg2[prop2])) {
                pass = true;
                break;
              }
            }
          }
          if (!pass) return false;
        }
      }
      return true;
    } else {
      return arg1 === arg2;
    }
  },

  parse(queryString: string): any {
    var result: any;
    var type: string;

    if (queryString === 'null') return null;
    if (queryString === 'undefined') return undefined;
    if (!isNaN(Number(queryString))) return Number(queryString);
    if (queryString === 'true') return true;
    if (queryString === 'false') return false;

    if (queryString.charAt(0) === '/') {
      let parts = decodeURI(queryString).split('/');
      let flags = parts.pop();
      queryString = parts.join('/').replace(/^\/|\/$/g, '');
      return new RegExp(queryString, flags);
    }

    if (queryString.charAt(0) === '{') {
      result = {};
      type = 'object';
    } else if (queryString.charAt(0) === '[') {
      result = [];
      type = 'array'
    } else return decodeURI(queryString);

    queryString = decodeURI(queryString).slice(1, -1);

    let temp: any = { value: '', prop: '' }
    let context: string = type === 'array' ? 'value' : 'prop';
    let level: number = 0;

    for (let i = 0; i < queryString.length; i++) {
      if (queryString.charAt(i) === ':' && level === 0 && type === 'object') {
        context = 'value';
        continue;
      } else if (queryString.charAt(i) === '[') {
        level++;
      } else if (queryString.charAt(i) === ']') {
        level--;
      } if (queryString.charAt(i) === '{') {
        level++;
      } else if (queryString.charAt(i) === '}') {
        level--;
      } else if (queryString.charAt(i) === ',' && level === 0) {
        if (type === 'array') {
          result.push(temp.value.trim());
        } else {
          result[temp.prop.trim()] = temp.value.trim();
          context = 'prop';
        }

        temp.prop = '';
        temp.value = '';
        continue;
      }

      temp[context] += queryString.charAt(i);

      if (i === queryString.length - 1) {
        if (type === 'array') result.push(temp.value.trim());
        else result[temp.prop.trim()] = temp.value.trim();
      }
    }

    if (type === 'array')
      result = result.map((prop: any) => this.parse(prop));
    else
      for (let prop in result)
        result[prop] = this.parse(result[prop]);

    return result;
  },

  toQueryObject(query: string): any {
    query = decodeURI(query);

    let result: any = {};
    let parts: any[] = query.split('&');

    for (let i = 0; i < parts.length; i++) {
      let part: any = parts[i];
      let pair: any[] = part.split('=');

      result[pair[0]] = pair[1] ? this.parse(pair[1]) : null;
    }

    return result;
  },

  pick(obj: any, props: string[]) {
    let result: any = {};
    for (let i = 0; i < props.length; i++) {
      let path = props[i].split('.');

      if (path.length === 1) {
        result[props[i]] = obj[props[i]];
        continue;
      }

      result[path[0]] = result[path[0]] || {};
      let temp = result;
      let currentvalue = obj[path[0]];
      for (let j = 1; j < path.length; j++) {
        currentvalue = currentvalue[path[j]];
        if (j === path.length - 1) {
          temp[path[j - 1]][path[j]] = currentvalue;
          break;
        }
        temp[path[j - 1]][path[j]] = temp[path[j - 1]][j] || {};
        temp = temp[path[j - 1]];
      }
    }

    return result;
  },

  omit(obj: any, props: string[]) {
    for (let i = 0; i < props.length; i++) {
      let path = props[i].split('.');

      if (path.length === 1) {
        delete obj[props[i]];
        continue;
      }

      let temp = obj;
      for (let j = 0; j < path.length; j++) {
        temp = temp[path[j]];
        if (j === path.length - 2) {
          delete temp[path[j + 1]];
          break;
        }
      }

    }

    return obj;
  },

  valueToString(value: any): string {
    let result = "";

    if (value === undefined)
      return 'undefined';

    if (value === null)
      return 'null';

    if (typeof value === 'number' || typeof value === 'string')
      return <string>value;

    if (value instanceof RegExp || typeof value === 'boolean')
      return value.toString();

    if (Array.isArray(value)) {
      result += '[';
      for (let i = 0; i < value.length; i++) {
        result += this.valueToString(value[i]);
        if (i < value.length - 1)
          result += ',';
      }
      result += ']';
      return result;
    }

    if (typeof value === "object") {
      result += '{';
      for (let prop in value) {
        result += prop + ':';
        result += this.valueToString(value[prop]);
        result += ','
      }

      result = result.length > 1 ? result.slice(0, result.length - 1) : result;
      result += '}';
      return result;
    }

    return result;
  },

  objectToQueryString(obj: any, encode: boolean): string {
    let result = "";

    if (!obj || !Object.keys(obj).length)
      return result;

    for (let prop in obj)
      result += '&' + prop + '=' + this.valueToString(obj[prop]);

    return encode ? encodeURI(result.slice(1)) : result.slice(1);
  },

  compareValue(path: string, obj1: any, obj2: any): boolean {
    let value01 = this.getValue(obj1, path);
    let value02 = this.getValue(obj2, path);

    return this.equals(value01, value02, true);
  },

  compareValues(paths: string[], obj1: any, obj2: any): string {
    for (let i = 0; i < paths.length; i++)
      if (!this.compareValue(paths[i], obj1, obj2))
        return paths[i];

    return '';
  },

  getChanges(obj1: any, obj2: any) {
    let results: any = { count: 0, changes: [{}, {}] };
  
    if (obj1 === obj2)
      return results;
  
    if (typeof obj1 !== 'object' && typeof obj2 !== 'object') {
      results.changes[0] = obj1;
      results.changes[1] = obj2;
      results.count++;
      return results;
    }
  
    for (let prop in obj1) {
      if (obj2[prop] === obj1[prop])
        continue;
  
      if (typeof obj1[prop] === 'object' && typeof obj2[prop] === 'object') {
        if (Array.isArray(obj1[prop])) {
          if (Array.isArray(obj2[prop])) {
            if (obj1[prop].length === obj2[prop].length) {
                  results.changes[0][prop] = [];
                  results.changes[1][prop] = [];
              for ( let i = 0; i < obj1[prop].length; i++) {
                let subResults = this.getChanges(obj1[prop][i], obj2[prop][i]);
                if (subResults.count > 0) {
                  results.changes[0][prop].push(subResults.changes[0]);
                  results.changes[1][prop].push(subResults.changes[1]);
                }
              }
  
              if (results.changes[0][prop].length === 0) {
                delete results.changes[0][prop];
                delete results.changes[1][prop];
              }
  
              continue;
            }
          }
  
        } else {
  
          let subResults = this.getChanges(obj1[prop], obj2[prop]);
          if (subResults.count > 0) {
            results.changes[0][prop] = subResults.changes[0];
            results.changes[1][prop] = subResults.changes[1];
          }
  
          continue;
        }
  
  
      }
  
      results.changes[0][prop] = obj1[prop];
      results.changes[1][prop] = obj2[prop];
      results.count++;
    }
  
    return results;
  }
}