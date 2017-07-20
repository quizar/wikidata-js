
import * as Bluebird from 'bluebird';
import { readdir as fsReaddir, readFile as fsReadFile } from 'fs';

export { Bluebird }

export type PlainObject<T> = {
    [index: string]: T
}

export type AnyPlainObject = PlainObject<any>;
export type StringPlainObject = PlainObject<string>;

export function readdir(dir) {
    return new Bluebird<string[]>((resolve, reject) => {
        fsReaddir(dir, (error, files) => {
            if (error) {
                return reject(error);
            }
            resolve(files);
        });
    });
}

export function readFile(file) {
    return new Bluebird<string>((resolve, reject) => {
        fsReadFile(file, 'utf8', (error, content) => {
            if (error) {
                return reject(error);
            }
            resolve(content);
        });
    });
}
