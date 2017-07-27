
import * as Joi from 'joi';
import { validate as schemaValidate } from './validator';
import { Bluebird } from '../utils';

const schema = Joi.object().keys({
    id: Joi.string().regex(/^[a-z][a-z0-9-]{1,39}[a-z0-9]$/).required(),
    type: Joi.valid('subject').required(),
    name: Joi.string().trim().required(),
    params: Joi.array().items(Joi.string().trim().required()),
    query: Joi.string(),
    ref: Joi.object().keys({
        id: Joi.string().regex(/^[a-z][a-z0-9-]{1,39}[a-z0-9]$/).required(),
        params: Joi.object().pattern(/^[\w\d_-]{1,20}$/, Joi.string().trim().required())
    })
}).xor('query', 'ref').required();

export function validate<T>(data: T) {
    return schemaValidate<T>(schema, data);
}
