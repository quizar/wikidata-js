
import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION, AnyPlainObject, PlainObject } from './utils';
import { Query, QueryData, ExecuteQueryItemType } from './query';
import { SubjectQuery } from './subject-query';
import { PropertyValueType, createEnum } from 'quizar-domain';

export const QuestionInfoValueType = createEnum(['ENTITY', 'DATE', 'NUMBER', 'STRING', 'WIKIIMAGE', 'BOOLEAN']);
export type QuestionInfoValueType = keyof typeof QuestionInfoValueType;

export type QuestionInfoValue = {
    type: QuestionInfoValueType
    data: string
    max?: number
    min?: number
    groupBy?: string[]
}

export type QuestionInfoData = {
    subject: string, predicate: string, object: string, adverbs?: StringPlainObject
}

export type QuestionInfo = {
    id: string
    info: PlainObject<{
        title: string
        question: string
    }>
    format: 'VALUE' | 'YESNO' | 'IMAGE'
    difficulty: number
    data: QuestionInfoData
    value: QuestionInfoValue
    topics: string[]
}

export interface QuestionQueryData extends QueryData {
    subjects?: { name: string; params?: StringPlainObject }
    questions: QuestionInfo[]
}

export class QuestionQuery extends Query<StringPlainObject, QuestionQueryData> {

    static list(): Bluebird<String[]> {
        const dir = join(__dirname, '..', 'data', 'questions');
        return Query.getList('questions', dir);
    }
    static getData(name: string): Bluebird<QuestionQueryData> {
        const file = join(__dirname, '..', 'data', 'questions', name + DATA_FILE_EXTENSION);
        return Query.getContent<QuestionQueryData>(file).then(data => {
            data.name = name;
            return data;
        });
    }

    static get(name: string): Bluebird<QuestionQuery> {
        return QuestionQuery.getData(name).then(data => new QuestionQuery(data));
    }

    static execute(name: string, params?: StringPlainObject) {
        return QuestionQuery.get(name).then(query => query.execute(params));
    }

    protected parseDataItem(item: ExecuteQueryItemType): StringPlainObject {
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

    protected executeByName(name: string, params?: StringPlainObject): Bluebird<StringPlainObject[]> {
        return QuestionQuery.execute(name, params);
    }

    execute(params?: StringPlainObject): Bluebird<StringPlainObject[]> {
        if (!params && this.data.params && this.data.params.length && this.data.subjects) {
            return SubjectQuery.execute(this.data.subjects.name, this.data.subjects.params)
                .then(subjects =>
                    Bluebird.reduce(subjects, (result, subject) =>
                        this.execute({ subject: subject })
                            .then(r => result.concat(r)), []));
        }

        return super.execute(params);
    }
}
