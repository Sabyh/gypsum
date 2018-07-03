import * as fs from 'fs';
import * as Validall from 'validall';
import TB from 'tools-box';
import { State } from '../../state';
import { Logger } from '../../misc/logger';
import { RESPONSE_CODES } from '../../types';

export namespace FileCollection {
  export interface Document { _id: string;[key: string]: any; }
  export interface IFindOptions { skip?: number; limit?: number; }
  export interface IUpdateOptions { multi: boolean; returnDoc?: boolean }
  export interface IDeleteOptions { limit?: number; returnDoc?: boolean; }
  export interface ICollectionOptions {
    findOptions?: IFindOptions;
    updateOptions?: IUpdateOptions;
    deleteOptions?: IDeleteOptions;
  }
}

export interface IFileData {
  indexes: string[];
  documents: FileCollection.Document[];
}

export class FileCollection {
  protected filename: string;
  protected filePath: string;
  protected schema: Validall.Schema | null;
  protected findOptions: FileCollection.IFindOptions = { skip: -1, limit: -1 };
  protected updateOptions: FileCollection.IUpdateOptions = { returnDoc: false, multi: true };
  protected deleteOptions: FileCollection.IDeleteOptions = { returnDoc: false, limit: -1 };

  public logger: Logger;

  constructor(name: string, schema?: Validall.Schema, options?: FileCollection.ICollectionOptions) {
    let dir = State.config.files_data_dir;
    
    if (!fs.existsSync(dir))
      fs.mkdirSync(dir);

    this.filename = name;
    this.filePath = `${dir}/${name}`;
    this.schema = schema || null;
    this.logger = new Logger(name);

    if (options) {
      Object.assign(this.findOptions, options.findOptions || {});
      Object.assign(this.updateOptions, options.updateOptions || {});
      Object.assign(this.deleteOptions, options.deleteOptions || {});
    }

    try {
      fs.openSync(this.filePath, 'r');
    } catch (openError) {
      try {
        fs.writeFileSync(this.filePath, '{"indexes":[],"documents":[]}');
      } catch (writeError) {
        this.logger.error('error creating file' + this.filePath, writeError);
      }
    }
  }

  protected read(): Promise<IFileData> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, 'utf-8', (err, data) => {
        if (err) {
          this.logger.error(`Error reading file: '${this.filePath}':`, err);
          return reject({ message: `Error reading file: '${this.filePath}'`, original: err, code: RESPONSE_CODES.UNKNOWN_ERROR });
        }

        if (data) {
          try {
            let parsedData: IFileData = JSON.parse(data);
            resolve(parsedData);

          } catch (parseError) {
            this.logger.error(`Error parsing file: '${this.filePath}':`, parseError);
            reject({ message: `Error parsing file: '${this.filePath}'`, original: parseError, code: RESPONSE_CODES.UNKNOWN_ERROR });
          }

        } else {
          resolve({ indexes: [], documents: [] });
        }
      });
    });
  }

  protected write(data: IFileData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let dataString = '';

      try {
        dataString = JSON.stringify(data);

      } catch (stringifyError) {
        this.logger.error(`Error stringifying file: '${this.filePath}':`, stringifyError);
        reject({ message: `Error stringifying file: '${this.filePath}'`, original: stringifyError, code: RESPONSE_CODES.UNKNOWN_ERROR });
      }

      fs.writeFile(this.filePath, dataString, err => {
        if (err) {
          this.logger.error(`Error saving file: '${this.filePath}':`, err);
          reject({ message: `Error saving file: '${this.filePath}'`, original: err, code: RESPONSE_CODES.UNKNOWN_ERROR });
        } else {
          resolve(true);
        }
      });
    });
  }

  find(query: Validall.ISchema, projection?: string, options?: FileCollection.IFindOptions): Promise<FileCollection.Document[]> {
    options = Object.assign({}, this.findOptions, options || {});

    return new Promise((resolve, reject) => {
      this.read()
        .then((data: IFileData) => {
          let documents = data.documents;

          if (!documents || !documents.length)
            return resolve([]);

          let result: FileCollection.Document[] = [];
          let method: 'pick' | 'omit' = 'pick';
          let projectionList: string[] = [];

          if (projection) {
            projectionList = projection.split(',');

            if (projectionList[0] === '-') {
              method = 'omit';
              projectionList = projectionList.slice(1);
            }
          }

          for (let i = 0; i < documents.length; i++) {
            let state = Validall(documents[i], query);

            if (state) {
              if ((<any>options).skip-- > 0)
                continue;

              if (projectionList.length)
                result.push(TB[method](documents[i], projectionList));
              else
                result.push(documents[i]);

              if (--(<any>options).limit)
                break;
            }
          }

          if (!this.schema)
            return resolve(result);

          let selects = this.schema.getPropsByName('select');
          selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

          if (selects && selects.length)
            for (let i = 0; i < result.length; i++)
              TB.omit(result[i], selects);

          resolve(result);
        })
        .catch(error => reject(error));
    });
  }

  findById(id: string, projection?: string): Promise<FileCollection.Document> {
    return this.find({ _id: id }, projection, { limit: 1 })
      .then(docs => {
        return docs[0];
      });
  }

  findOne(query: Validall.ISchema, projection?: string): Promise<FileCollection.Document> {
    return this.find(query, projection, { limit: 1 })
      .then(docs => {
        return docs[0];
      });
  }

  count(query: Validall.ISchema): Promise<number> {
    return new Promise((resolve, reject) => {
      this.read()
        .then((data: IFileData) => {
          let documents = data.documents;

          if (!documents || documents.length)
            return resolve(0);

          if (Object.keys(query).length === 0)
            return resolve(documents.length);

          let count = 0;

          for (let i = 0; i < documents.length; i++)
            if (Validall(documents[0], query))
              count++;

          resolve(count);
        })
        .catch(error => reject(error));
    });
  }

  insert(documents: any[]): Promise<FileCollection.Document[]> {
    return new Promise((resolve, reject) => {
      this.read()
        .then((data: IFileData) => {
          if (documents && !Array.isArray(documents))
            documents = [documents];

          if (!documents || !documents.length)
            return resolve([]);

          for (let i = 0; i < documents.length; i++) {
            let document = documents[i];
            delete document._id;

            if (this.schema) {
              if (!this.schema.test(document))
                return reject({
                  message: this.schema.error.message,
                  original: this.schema.error,
                  code: RESPONSE_CODES.BAD_REQUEST
                });

              let props = this.schema.getProps();
              let internals = [];

              for (let prop in props)
                if (props[prop].internal)
                  internals.push(prop);

              if (internals.length) {
                for (let i = 0; i < internals.length; i++)
                  if (this.schema.defaults[internals[i]] !== undefined)
                    if (TB.getValue(document, internals[i]) !== this.schema.defaults[internals[i]])
                      return reject({
                        message: `[${this.filename}]: '${internals[i]}' cannot be set externaly!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      });
                    else if (TB.getValue(document, internals[i]) !== undefined)
                      return reject({
                        message: `[${this.filename}]: '${internals[i]}' cannot be set externaly!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      })
              }

              while (true) {
                let id: string = TB.random();
                if (data.indexes.indexOf(id) === -1) {
                  document._id = id;
                  break;
                }
              }

              data.indexes.push(document._id);
              data.documents.push(document);
            }
          }

          this.write(data)
            .then(() => {
              resolve(documents)
              if (!this.schema)
                return resolve(documents);

              let selects = this.schema.getPropsByName('select');
              selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

              if (selects && selects.length)
                for (let i = 0; i < documents.length; i++)
                  TB.omit(documents[i], selects);

              resolve(documents);
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  update(filter: Validall.ISchema, update: any, options?: FileCollection.IUpdateOptions, single = false): Promise<FileCollection.Document | FileCollection.Document[] | number> {
    if (options)
      options = Object.assign({}, this.updateOptions, options);

    return new Promise((resolve, reject) => {
      if (!Validall.Types.object(update) || !Object.keys(update).length)
        return reject({ message: `invalid update data: ${update}`, code: RESPONSE_CODES.BAD_REQUEST });

      delete update._id;

      this.read()
        .then((data: IFileData) => {
          let result = 0;
          let docs: FileCollection.Document[] = [];

          for (let i = 0; i < data.documents.length; i++) {
            if (Validall(data.documents[i], filter)) {
              result++;
              let updatedDoc = <FileCollection.Document>{};
              TB.extend(updatedDoc, data.documents[i]);

              if (Validall.Types.primitive(data.documents[i]))
                updatedDoc = update;
              else
                TB.extend(updatedDoc, update);

              if (this.schema) {
                if (!this.schema.test(updatedDoc))
                  return reject({
                    message: this.schema.error.message,
                    original: this.schema.error,
                    code: RESPONSE_CODES.BAD_REQUEST
                  });

                let props = this.schema.getProps();
                if (Object.keys(props).length) {
                  let constants: string[] = [], internals: string[] = [];

                  for (let prop in props) {
                    if (props[prop].constant)
                      constants.push(prop);
                    else if (props[prop].internal) {
                      internals.push(prop);
                    }
                  }

                  if (constants.length) {
                    let changedField = TB.compareValues(constants, data.documents[i], updatedDoc);
                    if (changedField)
                      return reject({
                        message: `[${this.filename}]: '${changedField}' is a constant field that cannot be changed!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      });
                  }

                  if (internals.length) {
                    let changedField = TB.compareValues(internals, data.documents[i], updatedDoc);
                    if (changedField)
                      return reject({
                        message: `[${this.filename}]: '${changedField}' cannot be modified externaly!`,
                        code: RESPONSE_CODES.UNAUTHORIZED
                      });
                  }
                }
              }

              data.documents[i] = updatedDoc;
              docs.push(updatedDoc);


              if (!(<FileCollection.IUpdateOptions>options).multi)
                break;
            }
          }

          if (result)
            this.write(data)
              .then(() => {
                if (options && options.returnDoc) {
                  if (!this.schema)
                    return resolve(single ? docs[0] : docs);

                  let selects = this.schema.getPropsByName('select');
                  selects = selects.filter((item: any) => item.value === false).map((item: any) => item.path);

                  if (selects && selects.length)
                    for (let i = 0; i < docs.length; i++)
                      TB.omit(docs[i], selects);

                  resolve(single ? docs[0] : docs);
                } else {
                  resolve(result);
                }
              })
              .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  }

  updateById(id: string, update: any): Promise<FileCollection.Document | null> {
    return this.update({ _id: id }, update, { multi: false, returnDoc: true }, true)
      .then((docs: FileCollection.Document[]) => {
        if (docs && docs.length)
          return docs[0];
        else
          return null;
      });
  }

  updateOne(filter: Validall.ISchema, update: any): Promise<FileCollection.Document | null> {
    return this.update(filter, update, { multi: false, returnDoc: true }, true)
      .then((docs: FileCollection.Document[]) => {
        if (docs && docs.length)
          return docs[0];
        else
          return null;
      });
  }

  delete(filter: Validall.ISchema, options?: FileCollection.IDeleteOptions): Promise<FileCollection.Document[] | number> {
    if (options)
      options = Object.assign({}, this.deleteOptions, options);

    return new Promise((resolve, reject) => {
      let limit = options ? options.limit || 1 : 1;

      this.read()
        .then((data: IFileData) => {
          let result = 0;
          let docs: FileCollection.Document[] = [];

          for (let i = 0; i < data.documents.length; i++) {
            if (Validall(data.documents[i], filter)) {
              result++;
              let idIndex = data.indexes.findIndex(index => index === data.documents[i]._id);

              if (idIndex > -1)
                data.indexes.splice(idIndex, 1);

              docs.push(data.documents.splice(i--, 1)[0]);

              if (--limit === 0)
                break;
            }
          }

          if (result)
            this.write(data)
              .then(() => resolve((options && options.returnDoc) ? docs : result))
              .catch(error => reject(error));
        })
        .catch(error => reject(error));
    })
  }

  deleteById(id: string): Promise<FileCollection.Document> {
    return this.delete({ _id: id }, { limit: 1, returnDoc: true })
      .then((docs: FileCollection.Document[]) => {
        if (docs && docs.length)
          return docs[0];
        else
          return <FileCollection.Document>{};
      });
  }

  deleteOne(filter: Validall.ISchema): Promise<FileCollection.Document> {
    return this.delete(filter, { limit: 1, returnDoc: true })
      .then((docs: FileCollection.Document[]) => {
        if (docs && docs.length)
          return docs[0];
        else
          return <FileCollection.Document>{};
      });
  }
}