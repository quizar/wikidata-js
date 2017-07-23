
import * as Joi from 'joi';
import { validate as schemaValidate } from './validator';
import { Bluebird } from '../utils';

const schema = Joi.object().keys({
    name: Joi.string().trim().required(),
    params: Joi.array().items(Joi.string().trim().required()),
    query: Joi.string(),
    subjects: Joi.object().keys({
        name: Joi.string().trim().required(),
        params: Joi.object().pattern(/^[\w\d_-]{1,20}$/, Joi.string().trim().required())
    }),
    questions: Joi.array().items(Joi.object().keys({
        id: Joi.string().regex(/^[\w\d_-]{1,40}$/).required(),
        info: Joi.object().pattern(/^[a-z]{2}$/, Joi.object().keys({ title: Joi.string(), question: Joi.string() }).or('title', 'question')),
        format: Joi.valid('VALUE', 'YESNO', 'IMAGE').required(),
        difficulty: Joi.number().integer().min(1).max(5).required(),
        data: Joi.object().keys({
            subject: Joi.string().required(),
            predicate: Joi.string().required(),
            object: Joi.string().required(),
            adverbs: Joi.object().pattern(/^[\w\d_-]{1,10}$/, Joi.string().required())
        }).required(),
        value: Joi.object().keys({
            data: Joi.string().required(),
            type: Joi.valid('DATE').required(),
            max: Joi.number().integer().min(1).max(1000),
            min: Joi.number().integer().min(1),
            groupBy: Joi.array().items(Joi.string())
        }).required(),
        topics: Joi.array().items(Joi.string()).min(1).max(5).required()
    })).min(1).required()
}).required();

export function validate<T>(data: T) {
    return schemaValidate<T>(schema, data);
}
