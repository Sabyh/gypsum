export interface IGypsumMulterConfig {
    uploadsURL: string;
    uploadsDir?: string;
    maxUploadCount?: number;
    limits?: any;
}
export declare function gypsumMulter(config: IGypsumMulterConfig): void;
