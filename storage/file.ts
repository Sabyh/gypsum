import * as path from 'path';
import * as fs from 'fs';
import * as Multer from 'multer';
import { MODEL, SERVICE } from "../decorators";
import { Model } from "../models";
import { Context } from "../context";
import { RESPONSE_CODES, Response } from '../types';
import { State } from '../state';
import { objectUtil } from '../util';

@MODEL({
  secure: State.storage.secure,
  authorize: State.storage.authorize
})
export class File extends Model {
  origin = `http${State.config.secure ? 's' : ''}//storage.${State.config.hostName}`
  uploader = Multer({
    storage: Multer.diskStorage({
      destination: State.storage.storageDir,
      filename: (req, file, callback) => {
        callback(null, `${Date.now()}`); //.${file.mimetype.split('/')[1]}
      }
    }),
    limits: State.storage.limits
  });

  private multerUploadPaths(ctx: Context, type: string, options: string) {
    let filePath: string;
    let filesPaths: any;

    if (type === 'single') {
      filePath = `${this.origin}/${options}/${ctx._req.file.filename}`;
      ctx.ok(new Response({ data: filePath }));
    } else if (type === 'array') {
      let filesPaths = (<any[]>ctx._req.files).map(file => {
        return `${this.origin}/${options}/${file.filename}`;
      });
      ctx.ok(new Response({ data: filesPaths }));
    }
  }

  @SERVICE({
    method: 'post',
    args: ['body']
  })
  uploadOne(body: any, ctx?: Context) {
    return new Promise((resolve, reject) => {
      (<any>ctx._req).userId = ctx.user._id;
      ctx.nextHook(this.multerUploadPaths, ['single', body.type]);
      this.uploader.single(body.type)(ctx._req, ctx._res, ctx.next);
      resolve();
    });
  }

  @SERVICE({
    method: 'post',
    args: ['body']
  })
  uploadMany(body: any, ctx?: Context) {
    return new Promise((resolve, reject) => {
      (<any>ctx._req).userId = ctx.user._id;
      ctx.nextHook(this.multerUploadPaths, ['array', body.type]);
      this.uploader.array(body.type, State.storage.maxUploadCount)(ctx._req, ctx._res, ctx.next);
      resolve();
    });
  }

  @SERVICE({
    method: 'post',
    args: ['body']
  })
  base64UploadOne(body: any, ctx?: Context) {
    return new Promise((resolve, reject) => {
      if (!body.type)
        return reject({
          message: 'file type was not provided!',
          code: RESPONSE_CODES.BAD_REQUEST
        });

      if (!body.file)
        return reject({
          message: 'file was not provided!',
          code: RESPONSE_CODES.BAD_REQUEST
        });

      let folderPath = path.join(State.storage.storageDir, body.type);

      if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath);

      let fileName = `${Date.now()}`;
      let parts = body.file.split(',');
      let data = parts[1];
      let mimeType = parts[0].split(':')[1].split(';')[0];
      let type = mimeType.split('/')[1];
      let filePath = path.join(folderPath, fileName);
      let clientFilePath = `${this.origin}/${body.type}/${fileName}`;

      try {
        fs.writeFileSync(path.join(filePath), data, 'base64');

        resolve({ data: clientFilePath });

      } catch (err) {
        this.$logger.error(err);

        this.removeOne(`${body.type}/${fileName}`)
          .then(removed => {
            reject({
              message: 'error writing file',
              original: err,
              code: RESPONSE_CODES.UNKNOWN_ERROR
            });
          })
          .catch(err => reject(err));
      }
    });
  }
  @SERVICE({
    method: 'post',
    args: ['body']
  })
  base64UploadMany(body: any, ctx?: Context) {
    return new Promise((resolve, reject) => {
      if (!body.type)
        return reject({
          message: 'file type was not provided!',
          code: RESPONSE_CODES.BAD_REQUEST
        });

      if (!body.files || body.files.length)
        return reject({
          message: 'files were not provided!',
          code: RESPONSE_CODES.BAD_REQUEST
        });

      let folderPath = path.join(State.storage.storageDir, body.type);

      if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath);

      let savedFiles = [];
      let clientPaths = [];

      for (let i = 0; i < body.files.length && i < State.storage.maxUploadCount; i++) {

        let fileName = `${Date.now()}`;
        let parts = body.files[i].split(',');
        let data = parts[1];
        let mimeType = parts[0].split(':')[1].split(';')[0];
        let type = mimeType.split('/')[1];
        let filePath = path.join(folderPath, fileName);
        let clientFilePath = `${this.origin}/${body.type}/${fileName}`;

        try {
          fs.writeFileSync(path.join(filePath), data, 'base64');
          clientPaths.push(clientFilePath);
          savedFiles.push(`${body.type}/${fileName}`);

        } catch (err) {
          this.$logger.error(err);

          clientPaths = [];
          this.removeMany(savedFiles)
            .then(removed => {
              reject({
                message: 'error writing file',
                original: err,
                code: RESPONSE_CODES.UNKNOWN_ERROR
              });
            })
            .catch(err => reject(err));
        }
      }

      if (clientPaths.length)
        resolve({ data: clientPaths });

    });
  }

  @SERVICE({
    method: 'delete',
    args: ['body.filePath']
  })
  removeOne(filePath: string, ctx?: Context) {
    return new Promise((resolve, reject) => {

      if (!filePath) {
        return reject({
          message: 'filePath was not provided',
          code: RESPONSE_CODES.BAD_REQUEST
        })
      }
      let fullPath = path.join(State.storage.storageDir, filePath);
      fs.unlink(fullPath, (err) => {
        if (err) {
          return reject({
            message: 'error removing file ' + filePath,
            original: err,
            code: RESPONSE_CODES.UNKNOWN_ERROR
          });
        }

        resolve(true);
      });
    });
  }

  @SERVICE({
    method: 'delete',
    args: ['body.filesPaths']
  })
  removeMany(filesPaths: string[], ctx?: Context) {
    return new Promise((resolve, reject) => {

      if (!filesPaths && filesPaths.length) {
        return reject({
          message: 'filesPaths was not provided',
          code: RESPONSE_CODES.BAD_REQUEST
        })
      }

      try {
        for (let i = 0; i < filesPaths.length; i++) {
          let fullPath = path.join(State.storage.storageDir, filesPaths[i]);
          fs.unlinkSync(fullPath);
        }

        resolve(true);

      } catch (err) {
        return reject({
          message: 'error removing files',
          original: err,
          code: RESPONSE_CODES.UNKNOWN_ERROR
        });
      }
    });
  }
}