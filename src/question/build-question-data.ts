
const debug = require('debug')('quizar-wikidata');

import { QuestionQueryData, QuestionInfo, QuestionInfoData } from '../question-query';
import { Question, QuestionSource, QuestionSourceData } from 'quizar-domain';
import { Bluebird, AnyPlainObject, _, StringPlainObject, PlainObject } from '../utils';
import { LocalEntity, exploreEntity } from '../entity';
import { isEntityId } from 'quizar-domain';

export type QuestionDataType = {
    subject: string | LocalEntity, predicate: string, object: string | LocalEntity, adverbs?: PlainObject<string | LocalEntity>
}

export function buildQuestionData(lang: string, infoData: QuestionInfoData): Bluebird<QuestionDataType> {
    const data: QuestionDataType = _.cloneDeep(infoData);

    const entityMap = getEntityMap(data);

    debug('entityMap=', entityMap);

    return Bluebird.each(Object.keys(entityMap), entityId => exploreEntity(entityId, lang)
        .then(entity => {
            if (!entity) {
                return Bluebird.reject(new Error('not found entity id=' + entityId));
            }
            entityMap[entityId].forEach(p => _.set(data, p, entity));
        }))
        .return(data);
}

function getEntityMap(data: AnyPlainObject): PlainObject<string[]> {
    debug('build entity map from ', data);
    let keys: PlainObject<string[]> = {};
    Object.keys(data).forEach(key => {
        const id = data[key];
        if (~[null, undefined].indexOf(id)) {
            debug('delete null question data item');
            delete data[key];
            return;
        }
        if (typeof id === 'string') {
            if (isEntityId(id)) {
                keys[id] = keys[id] || [];
                keys[id].push(key);
            }
        } else {
            const ndata = getEntityMap(id);
            Object.keys(ndata).forEach(nid => {
                keys[nid] = keys[nid] || [];
                keys[nid] = keys[nid].concat(ndata[nid].map(k => key + '.' + k));
            });
        }
    });

    return keys;
}
