
import { join } from 'path';
import { Bluebird, StringPlainObject, DATA_FILE_EXTENSION } from './utils';
import { Query, QueryDataInfo, ExecuteQueryItemType } from './query';

export class SubjectQuery extends Query<string, QueryDataInfo> {

    static list(): Bluebird<String[]> {
        const dir = join(__dirname, '..', 'data', 'subjects');
        return Query.getList('subjects', dir);
    }

    static getDataInfo(id: string): Bluebird<QueryDataInfo> {
        const file = join(__dirname, '..', 'data', 'subjects', id + DATA_FILE_EXTENSION);
        return Query.getContent<QueryDataInfo>(file).then(data => {
            data.id = id;
            return data;
        });
    }

    static get(id: string): Bluebird<SubjectQuery> {
        return SubjectQuery.getDataInfo(id).then(data => new SubjectQuery(data));
    }

    static execute(id: string, params?: StringPlainObject) {
        return SubjectQuery.get(id).then(query => query.execute(params));
    }

    protected parseDataItem(item: ExecuteQueryItemType): string {
        return item['id'].value.substr(item['id'].value.lastIndexOf('/') + 1);
    }

    protected executeById(id: string, params?: StringPlainObject): Bluebird<string[]> {
        return SubjectQuery.execute(id, params);
    }
}
