
import { Bluebird, PlainObject } from './utils';
import * as request from 'request';

export type ExecuteQueryItemType = PlainObject<{ type: string, value: string }>;

export function execute(query: string): Bluebird<ExecuteQueryItemType[]> {
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
