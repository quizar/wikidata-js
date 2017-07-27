
const debug = require('debug')('quizar-wikidata');

import { QuestionQueryTemplate, QuestionInfo, QuestionInfoData, QuestionInfoValueType, QuestionInfoValueFormat, QuestionQueryDataItem } from './question-query';
import { Question, QuestionSource, QuestionSourceData, PropertyValueType, QuestionValueFormat, isEntityId, QuestionCategory } from 'quizar-domain';
import { Bluebird, AnyPlainObject, _, StringPlainObject, PlainObject } from './utils';
import { convertLocalEntityToDomainEntity } from './entity/converter';
import { LocalEntity, exploreEntity } from './entity';
import { QuestionQuery, QuestionInfoCategory } from './question-query';

const AsyncEventEmitter = require('async-eventemitter');

export type QuestionQueryInfo = {
    /** question query id (filename) */
    id: string
    /** question query params */
    params?: StringPlainObject
}

export type QuestionsBuilderOptions = {
    /** filter questions by lang*/
    lang?: string
    queries: QuestionQueryInfo[]
}

export class QuestionsBuilder {
    private events: any;
    private stopped = false;
    private started = false;
    private stream: Bluebird<void>;

    constructor(private options: QuestionsBuilderOptions) {
        this.events = new AsyncEventEmitter();
    }

    on(event: string, listener?: (e: Error, next?: () => void) => void) {
        this.events.on(event, listener);
        return this;
    }

    once(event: string, listener?: (e: Error, next?: () => void) => void) {
        this.events.once(event, listener);
        return this;
    }

    stop() {
        this.stopped = true;
        if (this.stream) {
            this.stream.cancel();
        }
    }

    start() {
        if (this.stopped) {
            this.events.emit('error', new Error('instance is stopped'));
            return this;
        }
        if (this.started) {
            this.events.emit('error', new Error('instance is started'));
            return this;
        }

        this.started = true;

        // foreach question query id:
        this.stream = Bluebird.each(this.options.queries, query => {
            if (this.stopped) {
                return;
            }
            // get question query by id:
            return QuestionQuery.get(query.id).then(questionQuery => {
                if (this.stopped) {
                    return;
                }
                const template = questionQuery.template;
                // execute question query:
                return questionQuery.execute(query.params)
                    .then(queryValues => {
                        // foreach question info in question data info
                        return Bluebird.each(template.questions, qinfo => {
                            if (this.stopped) {
                                return;
                            }
                            const questionValues = queryValues.map(item => <QuestionInfoData>setDataValues(qinfo.data, item));
                            const questionValuesGroup = _.groupBy(questionValues, (item) => {
                                const key = qinfo.value.groupBy.map(groupBy => _.get(item, groupBy));
                                // debug('groupby key', key);
                                return key.join('-');
                            });
                            // foreach values group
                            return Bluebird.each(Object.keys(questionValuesGroup),
                                groupKey => {
                                    if (this.stopped) {
                                        return;
                                    }
                                    const langs = (!!this.options.lang) ? [this.options.lang] : Object.keys(qinfo.info);
                                    const qdata = questionValuesGroup[groupKey];
                                    // foreach question language
                                    return Bluebird.each(langs, l => {
                                        if (this.stopped) {
                                            return;
                                        }
                                        if (!qinfo.info[l]) {
                                            return Bluebird.reject(new Error('Invalid lang=' + l));
                                        }
                                        return buildQuestionData(l, qdata[0])
                                            .then(data => buildQuestion(l, qinfo, qdata, data))
                                            .then(question => {
                                                if (question && !this.stopped) {
                                                    return new Bluebird((resolve, reject) => {
                                                        this.events.emit('question', question, resolve);
                                                    });
                                                }
                                            }).catch(e => (!this.stopped) && this.events.emit('error', e));
                                    });
                                });
                        });
                    });
            })
        })
            .catch(e => (!this.stopped) && this.events.emit('error', e))
            .finally(() => (!this.stopped) && this.events.emit('end'));

        return this;
    }
}

function buildQuestion(lang: string, qinfo: QuestionInfo, qdata: QuestionInfoData[], entityData: QuestionDataType): Question {
    const question: Question = {
        lang: lang,
        difficulty: qinfo.difficulty,
        format: qinfo.format,
        valueType: getValueType(qinfo.value.type),
        valueFormat: getValueFormat(qinfo.value.format),
        category: getCategory(qinfo.category),
        values: qdata.map(item => { return { value: <string>_.get(item, qinfo.value.data) } }).filter(item => item.value && item.value.length)
    };

    if (question.values.length === 0) {
        debug('no values for question=' + qinfo.id);
        return null;
    }

    // values
    if (qinfo.value.max && qinfo.value.max < question.values.length) {
        throw new Error('Question ' + qinfo.id + ' has too many values: ' + question.values.length);
    }
    if (qinfo.value.min && qinfo.value.min > question.values.length) {
        throw new Error('Question ' + qinfo.id + ' has insufficient values: ' + question.values.length);
    }

    // topics
    question.topics = qinfo.topics.map(item => {
        var local = <LocalEntity>_.get(entityData, item);
        if (!local || !local.entity) {
            throw new Error(`Invalid QuestionInfo.topics item: ${item}`);
        }
        return convertLocalEntityToDomainEntity(local);
    });

    // info
    const info = qinfo.info[lang];
    if (info.title) {
        question.title = formatString(info.title, entityData);
    }
    if (info.description) {
        question.description = formatString(info.description, entityData);
    }

    debug('built question', question.title);

    return question;
}

function formatString(text: string, data: QuestionDataType): string {
    let result;
    const textReg = /\$\{([\w\d_.-]+)\}/;
    while ((result = textReg.exec(text)) !== null) {
        const name = result[1];
        const reg = new RegExp('\\$\\{' + name + '\\}', 'g');
        const value = <string>_.get(data, name);
        if (~[null, undefined, ''].indexOf(value)) {
            throw new Error(`Invalid format name: ${name} in question info`);
        }
        // debug('string replace name=' + name + ', reg=', reg, 'value', value);
        text = text.replace(reg, value);
    }

    return text;
}

function getCategory(type: QuestionInfoCategory): QuestionCategory {
    switch (type) {
        case QuestionInfoCategory.ART:
            return QuestionCategory.ART;
        case QuestionInfoCategory.SCIENCE:
            return QuestionCategory.SCIENCE;
        case QuestionInfoCategory.TECH:
            return QuestionCategory.TECH;
        case QuestionInfoCategory.ENTERTAINMENT:
            return QuestionCategory.ENTERTAINMENT;
        case QuestionInfoCategory.SPORTS:
            return QuestionCategory.SPORTS;
        case QuestionInfoCategory.GEOGRAPHY:
            return QuestionCategory.GEOGRAPHY;
        case QuestionInfoCategory.HISTORY:
            return QuestionCategory.HISTORY;
        default: throw new Error('Invalid QuestionInfoCategory: ' + type);
    }
}

function getValueFormat(type: QuestionInfoValueFormat): QuestionValueFormat {
    switch (type) {
        case QuestionInfoValueFormat.VALUE:
            return QuestionValueFormat.VALUE;
        case QuestionInfoValueFormat.IMAGE:
            return QuestionValueFormat.IMAGE;
        case QuestionInfoValueFormat.NAME:
            return QuestionValueFormat.NAME;
        default: throw new Error('Invalid QuestionInfoValueFormat: ' + type);
    }
}

function getValueType(type: QuestionInfoValueType): PropertyValueType {
    switch (type) {
        case QuestionInfoValueType.BOOLEAN:
            return PropertyValueType.BOOLEAN;
        case QuestionInfoValueType.DATE:
            return PropertyValueType.DATE;
        case QuestionInfoValueType.ENTITY:
            return PropertyValueType.ENTITY;
        case QuestionInfoValueType.NUMBER:
            return PropertyValueType.NUMBER;
        case QuestionInfoValueType.STRING:
            return PropertyValueType.STRING;
        case QuestionInfoValueType.WIKIIMAGE:
            return PropertyValueType.WIKIIMAGE;
        default: throw new Error('Invalid QuestionInfoValueType: ' + type);
    }
}

function setDataValues(props: AnyPlainObject, dataItem: StringPlainObject): AnyPlainObject {
    return Object.keys(props).reduce((result, key) => {
        if (typeof props[key] === 'string') {
            if (props[key][0] === '?') {
                debug('found prop key', key, props[key], dataItem);
                result[key] = dataItem[props[key].substr(1)];
            } else {
                result[key] = props[key];
            }
        } else {
            debug('value no string', key, props[key]);
            result[key] = setDataValues(props[key], dataItem);
        }

        return result;
    }, {});
}

type QuestionDataType = {
    subject: string | LocalEntity, predicate: string, object: string | LocalEntity, adverbs?: PlainObject<string | LocalEntity>
}

function buildQuestionData(lang: string, infoData: QuestionInfoData): Bluebird<QuestionDataType> {
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