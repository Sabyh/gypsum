import * as Multer from 'multer';

export interface IStorageConfig {
  storageDir?: string;
  secure?: boolean;
  authorize?: any;
  limits?: any;
  maxUploadCount?: number;
}

export interface IStorageEnvConfig {
  dev: IStorageConfig,
  prod?: IStorageConfig
}

export const defaultStorageConfig: IStorageConfig = {
  storageDir: 'storage',
  secure: true,
  authorize: false,
  limits: null,
  maxUploadCount: 5
}