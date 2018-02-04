import { Logger } from '../misc/logger';
import { IService, IHook } from '../types';
export declare type ServiceOptions = {
    [key: string]: IService | boolean;
};
export declare type getOptions = 'name' | 'secure' | 'authorize' | 'accessable' | 'internal' | 'eliminate' | 'apiType' | 'before' | 'after' | 'schema' | 'schemaOptions' | 'domain' | 'indexes';
export declare class Model {
    private _servicesData;
    private _hooksData;
    type: 'Mongo' | 'File' | undefined;
    $logger: Logger;
    static createPath(service: IService, prefix?: string): string;
    private _mArrangeServices();
    private _mArrangeHooks();
    protected init(): void;
    $get(prop: getOptions): any;
    $getServices(): {
        [key: string]: IService;
    };
    $getService(name: string): IService;
    $getHooks(): {
        [key: string]: IHook;
    };
    $hasService(name: string): boolean;
    $hasHook(name: string): boolean;
}
