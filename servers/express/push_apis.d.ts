import * as express from 'express';
import { Logger } from '../../misc/logger';
export declare function pushApis(app: express.Express, appName?: string, isSubDomain?: boolean, spa?: string, logger?: Logger): void;
