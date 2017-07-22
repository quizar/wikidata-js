
import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION } from './utils';
import { Query, QueryData, ExecuteQueryItemType } from './query';

export class SubjectQuery extends Query<string, QueryData> {

    static list(): Bluebird<String[]> {
        const dir = join(__dirname, '..', 'data', 'subjects');
        return Query.getList('subjects', dir);
    }

    static getData(name: string): Bluebird<QueryData> {
        const file = join(__dirname, '..', 'data', 'subjects', name + DATA_FILE_EXTENSION);
        return Query.getContent<QueryData>(file).then(data => {
            data.name = name;
            return data;
        });
    }

    static get(name: string): Bluebird<SubjectQuery> {
        return SubjectQuery.getData(name).then(data => new SubjectQuery(data));
    }

    static execute(name: string, params?: StringPlainObject) {
        return SubjectQuery.get(name).then(query => query.execute(params));
    }

    protected parseDataItem(item: ExecuteQueryItemType): string {
        return item['id'].value.substr(item['id'].value.lastIndexOf('/') + 1);
    }

    protected executeByName(name: string, params?: StringPlainObject): Bluebird<string[]> {
        return SubjectQuery.execute(name, params);
    }
}
