import * as path from 'path';
import * as fs from 'fs';
import { Gypsum } from '../main';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { State } from '../state';
import { RESPONSE_CODES } from '../types';
import { IHook } from '../decorators';
import { objectUtil } from '../util';

export interface IGypsumBase64UploadOptions {
  uploadsDir?: string;
  uploadsURL?: string;
  deleteOnErr?: boolean;
}

export interface IBase64UploadHookOptions {
  name: string;
  mimeTypes?: string[];
  limit?: number
  filePath?: string;
}

export function gypsumBase64Upload(options: IGypsumBase64UploadOptions): IHook {
  const logger = new Logger('base64Upload');
  const outDir = path.join(State.root, options.uploadsDir || 'uploads');
  const uploadsURL = options.uploadsURL || options.uploadsDir || 'uploads';
  const deleteOnErr = !!options.deleteOnErr;

  if (!fs.existsSync(outDir))
    fs.mkdirSync(outDir);

  function base64Upload(ctx: Context, hookOptions: IBase64UploadHookOptions[]) {
    let allSavedFiles = [];

    for (let i = 0; i < hookOptions.length; i++) {
      let filePath = "";
      if (hookOptions[i].filePath) {
        filePath = hookOptions[i].filePath!.replace(/@([\w_\d]+)/g, (match, $1) => {
          if ($1)
            return objectUtil.getValue(ctx, $1);

          return "";
        });
      }

      if (filePath && filePath.trimLeft.length) {
        let pathParts = filePath.split('/');
        let currentPath = outDir;

        for (let i = 0; i < pathParts.length; i++) {
          currentPath = path.join(currentPath, pathParts[i]);

          if (!fs.existsSync(currentPath))
            fs.mkdirSync(currentPath);
        }
      }

      let files = objectUtil.getValue(ctx.body, hookOptions[i].name);
      let limit = hookOptions[i].limit || Infinity;
      let savedFiles = [];

      files = Array.isArray(files) ? files : [files];

      // data:image/png;base64

      for (let j = 0; j < files.length && j < limit; j++) {
        if (files[j].indexOf('data') !== 0)
          continue;
          
        let parts = files[j].split(',');
        let data = parts[1];
        let mimeType = parts[0].split(':')[1].split(';')[0];
        let type = mimeType.split('/')[1];

        if (hookOptions[i].mimeTypes && hookOptions[i].mimeTypes!.length)
          if (hookOptions[i].mimeTypes!.indexOf(mimeType) === -1)
            continue;

        let fileName = `${Date.now()}.${type}`;
        let currentFilePath = `${uploadsURL}/${filePath}/${fileName}`;

        try {
          fs.writeFileSync(path.join(outDir, filePath, fileName), data, 'base64');
          savedFiles.push(currentFilePath);
          allSavedFiles.push(path.join(outDir, filePath, fileName));
        } catch (err) {
          logger.error(err);

          if (deleteOnErr === true)
            deleteFiles(allSavedFiles);
          return ctx.next({
            message: 'error writing file',
            original: err,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          });
        }
      }

      if (savedFiles.length) {
        objectUtil.setValue(ctx.body, hookOptions[i].name, savedFiles[0].length === 1 ? savedFiles[0] : savedFiles);
      } else {
        return ctx.next({
          message: 'no files were saved',
          code: RESPONSE_CODES.UNKNOWN_ERROR
        });
      }

      ctx.next();
    }

    function deleteFiles(paths: string[]) {
      return new Promise((resolve, reject) => {
        for (let i = 0; i < paths.length; i++) {
          try {
            fs.unlinkSync(paths[i]);
          } catch (err) {
            reject(err);
          }
        }

        resolve();
      });
    }
  }

  return base64Upload;
}