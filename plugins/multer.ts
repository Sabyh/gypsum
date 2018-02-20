import * as path from 'path';
import * as Multer from 'multer';
import { Gypsum } from '../main';
import { Context } from '../context';
import { Logger } from '../misc/logger';
import { State } from '../state';

export interface IGypsumMulterConfig {
  uploadsURL: string;
  uploadsDir?: string;
  maxUploadCount?: number;
  limits?: any;
}

export function gypsumMulter(config: IGypsumMulterConfig) {
  const logger = new Logger('multer');

  config.uploadsDir = config.uploadsDir || 'uploads';
  config.uploadsURL = config.uploadsURL || `${State.config.origin}/${config.uploadsDir}`;

  const storage = Multer.diskStorage({
    destination: path.join(State.root, config.uploadsDir || 'uploads'),
    filename: (req, file, callback) => {
      callback(null, `${Date.now()}.${file.mimetype.split('/')[1]}`);
    }
  });

  function multer(ctx: Context, type: string, options: any, limits: any) {
    if (!ctx._req || !ctx._res)
      return ctx.next();

    if (config.limits)
      limits = Object.assign({}, config.limits, limits);

    if (type === 'single' && typeof options === 'string') {
      ctx.nextHook(multerUploadPaths, [type, options]);
      Multer({ storage: storage, limits: limits }).single(options)(ctx._req, ctx._res, ctx.next);

    } else if (type === 'array' && options) {
      if (typeof options === 'string')
        options = { name: options, maxCount: config.maxUploadCount };
      else
        options = { name: options.name, maxCount: options.maxCount || config.maxUploadCount };

      ctx.nextHook(multerUploadPaths, [type, options]);
      Multer({ storage: storage, limits: limits }).array(options.name, options.maxCount)(ctx._req, ctx._res, ctx.next);

    } else if (type === 'fields' && Array.isArray(options)) {
      options = options.map(option => ({ name: option.name, maxCount: option.maxCount || config.maxUploadCount }));
      
      ctx.nextHook(multerUploadPaths, [type, options]);

      Multer({ storage: storage, limits: limits }).fields(options)(ctx._req, ctx._res, ctx.next);
    } else {
      logger.warn('invalid multer hook options');
    }

    ctx.next();
  }

  function multerUploadPaths(ctx: Context, type: string, options: any) {
    if (!ctx._req)
      return ctx.next();

    let filePath: string;
    let filesPaths: any;

    if (type === 'single') {
      filePath = `${config.uploadsURL}/${options}/${ctx._req.file.filename}`;
      ctx.set('filePath', filePath);
    } else if (type === 'array') {
      filesPaths = (<any[]>ctx._req.files).map(file => {
        return `${config.uploadsURL}/${options.name}/${file.filename}`;
      });
      ctx.set('filesPaths', filesPaths);
    } else {
      filesPaths = {};
      for (let prop in options) {
        filesPaths[prop] = (<any[]>ctx._req.files)[<any>prop].map((file: any) => {
          return `${config.uploadsURL}/${prop}/${file.filename}`;
        });
      }

      ctx.set('filesPaths', filesPaths);
    }

    ctx.next();
  }

  Gypsum.use({
    hooks: [multer]
  });
}