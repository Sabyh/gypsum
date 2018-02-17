export interface IObject {
    [key: string]: any;
}
export declare const objectUtil: {
    isObject(obj: any): boolean;
    desc(obj: IObject, indent: number): void;
    size(obj: IObject): number;
    merge(dest: IObject, src: IObject, overwrite: boolean, deep: boolean): IObject;
    fromPath(obj: IObject, path: string, value: any, inject: boolean): any;
    getValue(obj: IObject, path: string): any;
    setValue(obj: IObject, path: string, value: any): any;
    injectValue(obj: IObject, path: string, value: any): any;
    hasProperty(src: any, path: string): boolean;
    equals(arg1: any, arg2: any, deep: boolean): boolean;
    parse(queryString: string): any;
    toQueryObject(query: string): any;
    pick(obj: any, props: string[]): any;
    omit(obj: any, props: string[]): any;
    valueToString(value: any): string;
    objectToQueryString(obj: any, encode: boolean): string;
    compareValue(path: string, obj1: any, obj2: any): boolean;
    compareValues(paths: string[], obj1: any, obj2: any): string;
};
