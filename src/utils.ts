
import * as Bluebird from 'bluebird';
export const DATA_FILE_EXTENSION = '.yml';

export { Bluebird }

export type PlainObject<T> = {
    [index: string]: T
}

export type AnyPlainObject = PlainObject<any>;
export type StringPlainObject = PlainObject<string>;

