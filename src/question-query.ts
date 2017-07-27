
const debug = require('debug')('quizar-wikidata');

import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION, AnyPlainObject, PlainObject } from './utils';
import { WikidataQuery, QueryTemplate, WikidateValueItem } from './wikidata-query';
import { PropertyValueType, createEnum, QuestionValueFormat } from 'quizar-domain';

export const QuestionInfoValueType = createEnum(['ENTITY', 'DATE', 'NUMBER', 'STRING', 'WIKIIMAGE', 'BOOLEAN']);
export type QuestionInfoValueType = keyof typeof QuestionInfoValueType;

export const QuestionInfoValueFormat = createEnum(['VALUE', 'NAME', 'IMAGE']);
export type QuestionInfoValueFormat = keyof typeof QuestionInfoValueFormat;

export const QuestionInfoCategory = createEnum(['ART', 'SCIENCE', 'TECH', 'SPORTS', 'ENTERTAINMENT', 'GEOGRAPHY', 'HISTORY']);
export type QuestionInfoCategory = keyof typeof QuestionInfoCategory;

export type QuestionInfoValue = {
    type: QuestionInfoValueType
    data: string
    max?: number
    min?: number
    groupBy?: string[],
    format?: QuestionValueFormat
}

export type QuestionInfoData = {
    subject: string, predicate: string, object: string, adverbs?: StringPlainObject
}

export type QuestionInfo = {
    id: string
    name: string
    info: PlainObject<{
        description: string
        title: string
    }>
    format: 'VALUE' | 'YESNO' | 'IMAGE'
    difficulty: number
    data: QuestionInfoData
    value: QuestionInfoValue
    topics: string[]
    category: QuestionInfoCategory
}

export interface QuestionQueryTemplate extends QueryTemplate {
    subjects?: { id: string; params?: StringPlainObject; values?: StringPlainObject }
    questions: QuestionInfo[]
}

export type QuestionQueryDataItem = StringPlainObject

export class QuestionQuery extends WikidataQuery<QuestionQueryTemplate> {

    static get(id: string): Bluebird<QuestionQuery> {
        return WikidataQuery.getTemplate<QuestionQueryTemplate>('question', id).then(template => new QuestionQuery(template));
    }

    execute(params?: StringPlainObject): Bluebird<QuestionQueryDataItem[]> {
        if (!params && this.template.params && this.template.params.length && this.template.subjects) {
            return WikidataQuery.getTemplate('subject', this.template.subjects.id)
                .then(template => new WikidataQuery<QueryTemplate>(template))
                .then(query => query.execute(this.template.subjects.params))
                .then(subjects =>
                    Bluebird.reduce(subjects, (result, subject) => {
                        const values = this.template.subjects.values;

                        const params: StringPlainObject = Object.keys(values).reduce((r, prev) => {
                            r[prev] = subject[values[prev]];
                            return r;
                        }, {});

                        debug('build query params from source values: ', params, values);

                        return this.execute(params).then(r => result.concat(r));
                    }, []));
        }

        return super.execute(params);
    }
}
