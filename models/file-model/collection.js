"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Validall = require("validall");
const state_1 = require("../../state");
const logger_1 = require("../../misc/logger");
const types_1 = require("../../types");
const util_1 = require("../../util");
const defaultSchemaOptions = {
    required: false,
    strict: true,
    filter: false,
    root: 'document',
    throwMode: false,
    traceError: false
};
class FileCollection {
    constructor(name, schema, options) {
        this.findOptions = { skip: -1, limit: -1 };
        this.updateOptions = { returnDoc: false, multi: true };
        this.deleteOptions = { returnDoc: false, limit: -1 };
        let dir = state_1.State.config.files_data_dir;
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir);
        this.filename = name;
        this.filePath = `${dir}/${name}`;
        this.schema = schema ? new Validall.Schema(schema.schema, Object.assign({}, defaultSchemaOptions, { root: name }, schema.schemaOptions || {})) : null;
        this.logger = new logger_1.Logger(name);
        if (options) {
            Object.assign(this.findOptions, options.findOptions || {});
            Object.assign(this.updateOptions, options.updateOptions || {});
            Object.assign(this.deleteOptions, options.deleteOptions || {});
        }
        try {
            fs.openSync(this.filePath, 'r');
        }
        catch (openError) {
            try {
                fs.writeFileSync(this.filePath, '{"indexes":[],"documents":[]}');
            }
            catch (writeError) {
                this.logger.error('error creating file' + this.filePath, writeError);
            }
        }
    }
    read() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, 'utf-8', (err, data) => {
                if (err) {
                    this.logger.error(`Error reading file: '${this.filePath}':`, err);
                    return reject({ message: `Error reading file: '${this.filePath}'`, original: err, code: types_1.RESPONSE_CODES.UNKNOWN_ERROR });
                }
                if (data) {
                    try {
                        let parsedData = JSON.parse(data);
                        resolve(parsedData);
                    }
                    catch (parseError) {
                        this.logger.error(`Error parsing file: '${this.filePath}':`, parseError);
                        reject({ message: `Error parsing file: '${this.filePath}'`, original: parseError, code: types_1.RESPONSE_CODES.UNKNOWN_ERROR });
                    }
                }
                else {
                    resolve({ indexes: [], documents: [] });
                }
            });
        });
    }
    write(data) {
        return new Promise((resolve, reject) => {
            let dataString = '';
            try {
                dataString = JSON.stringify(data);
            }
            catch (stringifyError) {
                this.logger.error(`Error stringifying file: '${this.filePath}':`, stringifyError);
                reject({ message: `Error stringifying file: '${this.filePath}'`, original: stringifyError, code: types_1.RESPONSE_CODES.UNKNOWN_ERROR });
            }
            fs.writeFile(this.filePath, dataString, err => {
                if (err) {
                    this.logger.error(`Error saving file: '${this.filePath}':`, err);
                    reject({ message: `Error saving file: '${this.filePath}'`, original: err, code: types_1.RESPONSE_CODES.UNKNOWN_ERROR });
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    find(query, projection, options) {
        options = Object.assign({}, this.findOptions, options || {});
        return new Promise((resolve, reject) => {
            this.read()
                .then((data) => {
                let documents = data.documents;
                if (!documents || !documents.length)
                    return resolve([]);
                let result = [];
                let method = 'pick';
                let projectionList = [];
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
                        if (options.skip-- > 0)
                            continue;
                        if (projectionList.length)
                            result.push(util_1.objectUtil[method](documents[i], projectionList));
                        else
                            result.push(documents[i]);
                        if (--options.limit)
                            break;
                    }
                }
                resolve(result);
            })
                .catch(error => reject(error));
        });
    }
    findById(id, projection) {
        return this.find({ _id: id }, projection, { limit: 1 })
            .then(docs => {
            return docs[0];
        });
    }
    findOne(query, projection) {
        return this.find(query, projection, { limit: 1 })
            .then(docs => {
            return docs[0];
        });
    }
    count(query) {
        return new Promise((resolve, reject) => {
            this.read()
                .then((data) => {
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
    insert(documents) {
        return new Promise((resolve, reject) => {
            this.read()
                .then((data) => {
                if (documents && !Array.isArray(documents))
                    documents = [documents];
                if (!documents || documents.length)
                    return resolve([]);
                for (let i = 0; i < documents.length; i++) {
                    delete documents[1]._id;
                    if (this.schema && !this.schema.test(documents[i]))
                        return reject({ message: this.schema.error.toString(), original: this.schema.error, code: types_1.RESPONSE_CODES.BAD_REQUEST });
                    while (true) {
                        let id = util_1.random();
                        if (data.indexes.indexOf(id) === -1) {
                            documents[i]._id = id;
                            break;
                        }
                    }
                    data.indexes.push(documents[i]._id);
                    data.documents.push(documents[i]);
                }
                this.write(data)
                    .then(() => resolve(documents))
                    .catch(error => reject(error));
            })
                .catch(error => reject(error));
        });
    }
    update(filter, update, options) {
        if (options)
            options = Object.assign({}, this.updateOptions, options);
        return new Promise((resolve, reject) => {
            if (!Validall.Types.object(update) || !Object.keys(update).length)
                return reject({ message: `invalid update data: ${update}`, code: types_1.RESPONSE_CODES.BAD_REQUEST });
            delete update._id;
            this.read()
                .then((data) => {
                let result = 0;
                let docs = [];
                for (let i = 0; i < data.documents.length; i++) {
                    if (Validall(data.documents[i], filter)) {
                        result++;
                        docs.push(data.documents[i]);
                        if (Validall.Types.primitive(data.documents[i]))
                            data.documents[i] = update;
                        else
                            util_1.objectUtil.merge(data.documents[i], update, true, true);
                        if (!options.multi)
                            break;
                    }
                }
                if (result)
                    this.write(data)
                        .then(() => resolve((options && options.returnDoc) ? docs : result))
                        .catch(error => reject(error));
            })
                .catch(error => reject(error));
        });
    }
    updateById(id, update) {
        return this.update({ _id: id }, update, { multi: false, returnDoc: true })
            .then((docs) => {
            if (docs && docs.length)
                return docs[0];
            else
                return null;
        });
    }
    updateOne(filter, update) {
        return this.update(filter, update, { multi: false, returnDoc: true })
            .then((docs) => {
            if (docs && docs.length)
                return docs[0];
            else
                return null;
        });
    }
    delete(filter, options) {
        if (options)
            options = Object.assign({}, this.deleteOptions, options);
        return new Promise((resolve, reject) => {
            let limit = options ? options.limit || 1 : 1;
            this.read()
                .then((data) => {
                let result = 0;
                let docs = [];
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
        });
    }
    deleteById(id) {
        return this.delete({ _id: id }, { limit: 1, returnDoc: true })
            .then((docs) => {
            if (docs && docs.length)
                return docs[0];
            else
                return {};
        });
    }
    deleteOne(filter) {
        return this.delete(filter, { limit: 1, returnDoc: true })
            .then((docs) => {
            if (docs && docs.length)
                return docs[0];
            else
                return {};
        });
    }
}
exports.FileCollection = FileCollection;
//# sourceMappingURL=collection.js.map