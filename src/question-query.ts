
import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION, AnyPlainObject, PlainObject } from './utils';
import { Query, QueryData, ExecuteQueryItemType } from './query';
import { SubjectQuery } from './subject-query';

export type QuestionDataValue = {
    type: 'entity' | 'date' | 'year' | 'number' | 'string'
    data: string
}

export type QuestionDataInfo = {
    id: string
    info: PlainObject<{
        title: string
        question: string
    }>
    type: 'ONE' | 'MANY' | 'TF'
    data: { subject: string, predicate: string, object: string, adverbs?: StringPlainObject }
    value: QuestionDataValue
    topics: string[]
}

export interface QuestionQueryData extends QueryData {
    subjects?: { name: string; params?: StringPlainObject }
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

    // questions(data:ExecuteQueryItemType[], questionId?: string):Bluebird<>
}
