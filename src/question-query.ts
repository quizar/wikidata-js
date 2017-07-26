
import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION, AnyPlainObject, PlainObject } from './utils';
import { Query, QueryDataInfo, ExecuteQueryItemType } from './query';
import { SubjectQuery } from './subject-query';
import { PropertyValueType, createEnum, QuestionValueFormat } from 'quizar-domain';

export const QuestionInfoValueType = createEnum(['ENTITY', 'DATE', 'NUMBER', 'STRING', 'WIKIIMAGE', 'BOOLEAN']);
export type QuestionInfoValueType = keyof typeof QuestionInfoValueType;

export const QuestionInfoValueFormat = createEnum(['VALUE', 'NAME', 'IMAGE']);
export type QuestionInfoValueFormat = keyof typeof QuestionInfoValueFormat;

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
}

export interface QuestionQueryDataInfo extends QueryDataInfo {
    subjects?: { id: string; params?: StringPlainObject }
    questions: QuestionInfo[]
}

export type QuestionQueryDataItem = StringPlainObject

export class QuestionQuery extends Query<QuestionQueryDataItem, QuestionQueryDataInfo> {

    static list(): Bluebird<String[]> {
        const dir = join(__dirname, '..', 'data', 'questions');
        return Query.getList('questions', dir);
    }
    static getDataInfo(id: string): Bluebird<QuestionQueryDataInfo> {
        const file = join(__dirname, '..', 'data', 'questions', id + DATA_FILE_EXTENSION);
        return Query.getContent<QuestionQueryDataInfo>(file).then(data => {
            data.id = id;
            return data;
        });
    }

    static get(id: string): Bluebird<QuestionQuery> {
        return QuestionQuery.getDataInfo(id).then(data => new QuestionQuery(data));
    }

    static execute(id: string, params?: StringPlainObject) {
        return QuestionQuery.get(id).then(query => query.execute(params));
    }

    protected parseDataItem(item: ExecuteQueryItemType): QuestionQueryDataItem {
        const data: StringPlainObject = {};
        Object.keys(item).forEach(key => {
            data[key] = item[key].value;
            const result = /\/entity\/(Q\d+)$/.exec(data[key]);
            if (result && result.length > 1) {
                data[key] = result[1];
            }
        });

        return data;
    }

    protected executeById(id: string, params?: StringPlainObject): Bluebird<QuestionQueryDataItem[]> {
        return QuestionQuery.execute(id, params);
    }

    execute(params?: StringPlainObject): Bluebird<QuestionQueryDataItem[]> {
        if (!params && this.dataInfo.params && this.dataInfo.params.length && this.dataInfo.subjects) {
            return SubjectQuery.execute(this.dataInfo.subjects.id, this.dataInfo.subjects.params)
                .then(subjects =>
                    Bluebird.reduce(subjects, (result, subject) =>
                        this.execute({ subject: subject })
                            .then(r => result.concat(r)), []));
        }

        return super.execute(params);
    }
}
