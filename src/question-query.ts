
import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION, AnyPlainObject, PlainObject } from './utils';
import { Query, QueryData, ExecuteQueryItemType } from './query';
import { SubjectQuery } from './subject-query';
import { PropertyValueType } from 'quizar-domain';

export type QuestionDataValueType = 'entity' | 'date' | 'number' | 'string' | 'wiki-image' | 'boolean';

export type QuestionDataValue = {
    type: QuestionDataValueType
    data: string
    max?: number
    min?: number
    groupBy?: string[]
}

export type QuestionInfoInput = 'TYPE' | 'SELECT';

export type QuestionInfo = {
    id: string
    info: PlainObject<{
        title: string
        question: string
    }>
    format: 'VALUE' | 'YESNO' | 'IMAGE'
    input: QuestionInfoInput[]
    difficulty: number
    data: { subject: string, predicate: string, object: string, adverbs?: StringPlainObject }
    value: QuestionDataValue
    topics: string[]
}

export interface QuestionQueryData extends QueryData {
    subjects?: { name: string; params?: StringPlainObject }
    questions: QuestionInfo[]
}

export class QuestionQuery extends Query<ExecuteQueryItemType, QuestionQueryData> {

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

    protected parseDataItem(item: ExecuteQueryItemType): ExecuteQueryItemType {
        return item;
    }

    protected executeByName(name: string, params?: StringPlainObject): Bluebird<ExecuteQueryItemType[]> {
        return QuestionQuery.execute(name, params);
    }

    execute(params?: StringPlainObject): Bluebird<ExecuteQueryItemType[]> {
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
