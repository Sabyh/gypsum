import * as path from 'path';
import * as fs from 'fs';
import { Gypsum } from '../main';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { State } from '../state';
import { RESPONSE_CODES } from '../types';
import { IHook } from '../decorators';

export interface IGypsumBase64UploadOptions {
  uploadsDir: string;
  uploadsURL: string;
}

export function gypsumBase64Upload(options: IGypsumBase64UploadOptions): IHook {
  const logger = new Logger('base64Upload');

  options.uploadsDir = options.uploadsDir || 'uploads';

  function base64Upload(ctx: Context, filePath: string, field: string, isUpdate: boolean) {
    let outDir = path.join(State.root, options.uploadsDir, filePath),
      data = ctx.body.data.indexOf('base64') > -1 ? ctx.body.data.split(',')[1] : ctx.body.data,
      fileName = `${Date.now()}.${ctx.body.fileType}`;

    filePath = `${options.uploadsURL}/${filePath}/${fileName}`;

    fs.writeFile(path.join(outDir, fileName), data, 'base64', err => {
      if (err) {
        logger.error(err);
        return ctx.next({
          message: 'error writing file',
          original: err,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        });
      }

      ctx.set(field || 'filePath', filePath);
      ctx.next();
    });
  }

  return base64Upload;
}