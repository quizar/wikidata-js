
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
export const DATA_FILE_EXTENSION = '.yml';

export { Bluebird, _ }

export type PlainObject<T> = {
    [index: string]: T
}

export type AnyPlainObject = PlainObject<any>;
export type StringPlainObject = PlainObject<string>;

