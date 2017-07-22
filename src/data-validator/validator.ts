
import { Bluebird } from '../utils';
import { ObjectSchema } from 'joi';

export function validate<T>(schema: ObjectSchema, data: T): Bluebird<T> {
    const result = schema.validate(data, { abortEarly: true, allowUnknown: false, convert: false, noDefaults: true });
    if (result.error) {
        return Bluebird.reject(result.error);
    }
    return Bluebird.resolve(result.value);
}
