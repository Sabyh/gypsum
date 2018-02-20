import * as path from 'path';
import * as fs from 'fs';
import { Gypsum } from '../main';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { State } from '../state';
import { RESPONSE_CODES } from '../types';

export interface IGypsumBase64UploadOptions {
  uploadsDir: string;
  uploadsPath: string;
}

export function gypsumBase64Upload(options: IGypsumBase64UploadOptions) {
  const logger = new Logger('base64Upload');

  options.uploadsDir = options.uploadsDir || 'uploads';
  options.uploadsPath = options.uploadsPath || `${State.config.origin}/${options.uploadsDir}`;

  function base64Upload(ctx: Context, filePath: string, field: string, isUpdate: boolean) {
    let outDir = path.join(State.root, options.uploadsDir, filePath),
      data = ctx.body.data.indexOf('base64') > -1 ? ctx.body.data.split(',')[1] : ctx.body.data,
      fileName = `${Date.now()}.${ctx.body.fileType}`;

    filePath = `${options.uploadsPath}/${filePath}/${fileName}`;

    fs.writeFile(path.join(outDir, fileName), data, 'base64', err => {
      if (err) {
        console.log('error:', err);
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

  Gypsum.use({
    hooks: [base64Upload]
  });
}