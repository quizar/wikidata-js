
const debug = require('debug')('quizar-wikidata');

import { join } from 'path';
import { readdir as fsReaddir, readFile as fsReadFile } from 'fs';
import { Bluebird, PlainObject, StringPlainObject, DATA_FILE_EXTENSION } from './utils';
import { basename } from 'path';
import * as request from 'request';
import { safeLoad } from 'js-yaml';

export type WikidateValueItem = StringPlainObject

export type QueryTemplateRef = {
    readonly id: string
    readonly params?: StringPlainObject
}

export type QueryTemplateType = 'subject' | 'question';

export interface QueryTemplate {
    id: string
    type: QueryTemplateType
    readonly name?: string
    readonly params?: string[]
    readonly query?: string
    readonly ref?: QueryTemplateRef
}

/**
 * Base data Query class
 */
export class WikidataQuery<QT extends QueryTemplate> {
    private static listData: PlainObject<string[]> = {}

    constructor(public readonly template: QT) {
        debug('created new Query: ' + template.id);
    }

    static list(type: QueryTemplateType): Bluebird<string[]> {
        if (!WikidataQuery.listData[type]) {
            const dir = getQuertDir(type);
            return readdir(dir)
                .then(files => files.map(file => basename(file, DATA_FILE_EXTENSION)))
                .then(files => {
                    WikidataQuery.listData[type] = files;
                    return files;
                });
        }
        return Bluebird.resolve(WikidataQuery.listData[type]);
    }

    static getTemplate<QT extends QueryTemplate>(type: QueryTemplateType, id: string): Bluebird<QT> {
        const file = join(getQuertDir(type), id + DATA_FILE_EXTENSION);
        return readFile(file).then(content => <QT>safeLoad(content))
            .then(template => {
                template.id = id;
                template.type = type;
                return template
            });
    }

    execute(params?: StringPlainObject): Bluebird<WikidateValueItem[]> {
        debug('executing Query: ' + this.template.id);
        // validate params
        const paramsKeys = Object.keys(params || {});
        const dataParamsKeys = this.template.params || [];
        for (let i = 0; i < dataParamsKeys.length; i++) {
            const key = dataParamsKeys[i];
            if (paramsKeys.indexOf(key) < 0) {
                return Bluebird.reject(new Error(`Param ${key} is required`));
            }
        }

        // format query
        if (this.template.query) {
            let query = this.template.query;
            paramsKeys.forEach(key => {
                query = query.replace(new RegExp('\\${' + key + '}', 'g'), params[key]);
            });

            return execute(query).then(items => items.map(item => parseDataItem(item)));
        }

        return WikidataQuery.getTemplate<QT>(this.template.type, this.template.ref.id)
            .then(t => new WikidataQuery<QT>(t))
            .then(query => query.execute(this.template.ref.params));
    }
}

function parseDataItem(item: PlainObject<{ value: string, type: string }>): WikidateValueItem {
    const data: WikidateValueItem = {};
    Object.keys(item).forEach(key => {
        data[key] = item[key].value;
        const result = /\/entity\/(Q\d+)$/.exec(data[key]);
        if (result && result.length > 1) {
            data[key] = result[1];
        }
    });

    return data;
}

function execute(query: string): Bluebird<PlainObject<{ value: string, type: string }>[]> {
    debug('executing query ', query);
    return new Bluebird((resolve, reject) => {
        request({
            method: 'GET',
            uri: 'https://query.wikidata.org/sparql',
            qs: { query: query, format: 'json' },
            json: true
        }, (error, response, body) => {
            if (error) {
                return reject(error);
            }

            const data = body.results.bindings;

            resolve(data);
        });
    });
}

function getQuertDir(type: QueryTemplateType) {
    if (['question', 'subject'].indexOf(type) < 0) {
        throw new Error('Invalid list type!');
    }
    return join(__dirname, '..', 'data', type + 's');
}

function readdir(dir) {
    return new Bluebird<string[]>((resolve, reject) => {
        fsReaddir(dir, (error, files) => {
            if (error) {
                return reject(error);
            }
            resolve(files);
        });
    });
}

function readFile(file) {
    return new Bluebird<string>((resolve, reject) => {
        fsReadFile(file, 'utf8', (error, content) => {
            if (error) {
                return reject(error);
            }
            resolve(content);
        });
    });
}
