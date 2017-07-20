
import { join } from 'path';
import { Bluebird, readdir, readFile, StringPlainObject } from './utils';
import { execute as execureQuery, ExecuteQueryItemType } from './query';

let entitiesList: string[];

export type EntityQueryDataRef = {
    name: string
    params?: StringPlainObject
}

export type EntityQueryData = {
    name: string
    query?: string
    params?: string[],
    ref?: EntityQueryDataRef
}

export class EntityQuery {
    constructor(public readonly data: EntityQueryData) { }

    static list(): Bluebird<String[]> {
        if (!entitiesList) {
            return readdir(join(__dirname, '..', 'data', 'entities')).then(files => {
                entitiesList = files;
                return files;
            });
        }
        return Bluebird.resolve(entitiesList);
    }

    static get(name: string): Bluebird<EntityQuery> {
        return readFile(join(__dirname, '..', 'data', 'entities', name + '.json')).then(content => {
            const data: EntityQueryData = JSON.parse(content);
            data.name = name;
            return new EntityQuery(data);
        });
    }

    static execute(name: string, params?: StringPlainObject) {
        return EntityQuery.get(name).then(query => query.execute(params));
    }

    execute(params?: StringPlainObject): Bluebird<string[]> {
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

            return execureQuery(query).then(items => items.map(item => this.parseDataItem(item)));
        }

        // process ref query

        return EntityQuery.execute(this.data.ref.name, this.data.ref.params);
    }

    private parseDataItem(item: ExecuteQueryItemType): string {
        return item['id'].value.substr(item['id'].value.lastIndexOf('/') + 1);
    }
}
