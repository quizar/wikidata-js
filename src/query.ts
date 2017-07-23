
const debug = require('debug')('quizar-wikidata');

import { readdir as fsReaddir, readFile as fsReadFile } from 'fs';
import { Bluebird, PlainObject, StringPlainObject, DATA_FILE_EXTENSION } from './utils';
import { basename } from 'path';
import * as request from 'request';
import { safeLoad } from 'js-yaml';

export type ExecuteQueryItemType = PlainObject<{ type: string, value: string }>

export type QueryDataRef = {
    readonly id: string
    readonly params?: StringPlainObject
}

export interface QueryData {
    id: string
    readonly name?: string
    readonly params?: string[]
    readonly query?: string
    readonly ref?: QueryDataRef
}

/**
 * Base data Query class
 */
export abstract class Query<RESULT, QDT extends QueryData> {
    private static listData: PlainObject<string[]> = {}

    constructor(protected readonly data: QDT) { }

    static getList(name: string, dir: string): Bluebird<string[]> {
        if (!Query.listData[name]) {
            return readdir(dir)
                .then(files => files.map(file => basename(file, DATA_FILE_EXTENSION)))
                .then(files => {
                    Query.listData[name] = files;
                    return files;
                });
        }
        return Bluebird.resolve(Query.listData[name]);
    }

    static getContent<T>(file: string): Bluebird<T> {
        return readFile(file).then(content => <T>safeLoad(content));
    }

    execute(params?: StringPlainObject): Bluebird<RESULT[]> {
        // validate params
        const paramsKeys = Object.keys(params || {});
        const dataParamsKeys = this.data.params || [];
        for (let i = 0; i < dataParamsKeys.length; i++) {
            const key = dataParamsKeys[i];
            if (paramsKeys.indexOf(key) < 0) {
                return Bluebird.reject(new Error(`Param ${key} is required`));
            }
        }

        // format query
        if (this.data.query) {
            let query = this.data.query;
            paramsKeys.forEach(key => {
                query = query.replace(new RegExp('\\${' + key + '}', 'g'), params[key]);
            });

            return execute(query).then(items => items.map(item => this.parseDataItem(item)));
        }

        // process ref query
        return this.executeById(this.data.ref.id, this.data.ref.params);
    }

    protected abstract executeById(id: string, params?: StringPlainObject): Bluebird<RESULT[]>

    protected abstract parseDataItem(item: ExecuteQueryItemType): RESULT
}

function execute(query: string): Bluebird<ExecuteQueryItemType[]> {
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

export function readdir(dir) {
    return new Bluebird<string[]>((resolve, reject) => {
        fsReaddir(dir, (error, files) => {
            if (error) {
                return reject(error);
            }
            resolve(files);
        });
    });
}

export function readFile(file) {
    return new Bluebird<string>((resolve, reject) => {
        fsReadFile(file, 'utf8', (error, content) => {
            if (error) {
                return reject(error);
            }
            resolve(content);
        });
    });
}
