
import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION, AnyPlainObject } from './utils';
import { Query, QueryData, ExecuteQueryItemType } from './query';

export type QuestionDataValue = {
    type: 'entity' | 'date' | 'year' | 'number' | 'string'
    data: string
}

export type QuestionDataInfo = {
    id: string
    title: string
    question: string
    type: 'ONE' | 'MANY' | 'TF'
    data: { subject: string, predicate: string, object: string, adverbs?: StringPlainObject }
    value: QuestionDataValue
    topics: string[]
}

export interface QuestionQueryData extends QueryData {
    questions: QuestionDataInfo[]
}

export class QuestionQuery extends Query<ExecuteQueryItemType, QuestionQueryData> {

    static list(): Bluebird<String[]> {
        const dir = join(__dirname, '..', 'data', 'questions');
        return Query.getList('questions', dir);
    }

    static get(name: string): Bluebird<QuestionQuery> {
        const file = join(__dirname, '..', 'data', 'questions', name + DATA_FILE_EXTENSION);
        return Query.getContent<QuestionQueryData>(file).then(data => {
            data.name = name;
            return new QuestionQuery(data);
        });
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

    // questions(data:ExecuteQueryItemType[], questionId?: string):Bluebird<>
}
