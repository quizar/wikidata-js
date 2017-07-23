
const debug = require('debug')('quizar-wikidata');

import { QuestionQueryData, QuestionInfo, QuestionInfoData, QuestionInfoValueType, QuestionInfoValueFormat } from '../question-query';
import { Question, QuestionSource, QuestionSourceData, PropertyValueType, QuestionValueFormat } from 'quizar-domain';
import { Bluebird, AnyPlainObject, _, StringPlainObject } from '../utils';
import { buildQuestionData, QuestionDataType } from './build-question-data';
import { convertLocalEntityToDomainEntity } from '../entity/converter';
import { LocalEntity } from '../entity';
const AsyncEventEmitter = require('async-eventemitter');

export class QuestionsBuilder {
    private events: any;
    private stopped = false;
    private stream: Bluebird<void>;

    constructor(private data: QuestionQueryData, private items: StringPlainObject[], private lang?: string) {
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
        let questions: Question[] = [];

        this.stream = Bluebird.each(this.data.questions, qinfo => {
            if (this.stopped) {
                return;
            }
            const questionDatas = this.items.map(item => <QuestionInfoData>setDataValues(qinfo.data, item));
            const dataGroup = _.groupBy(questionDatas, (item) => {
                const key = qinfo.value.groupBy.map(groupBy => _.get(item, groupBy));
                // debug('groupby key', key);
                return key.join('-');
            });
            // debug('dataGroup', dataGroup);
            return Bluebird.each(Object.keys(dataGroup),
                groupKey => {
                    if (this.stopped) {
                        return;
                    }
                    const langs = (!!this.lang) ? [this.lang] : Object.keys(qinfo.info);
                    const qdata = dataGroup[groupKey];
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
        values: qdata.map(item => { return { value: <string>_.get(item, qinfo.value.data) } }).filter(item => item.value && item.value.length)
    };

    if (question.values.length === 0) {
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
    if (info.question) {
        question.question = formatString(info.question, entityData);
    }
    if (info.title) {
        question.title = formatString(info.title, entityData);
    }

    debug('built question', question.question || question.title);

    return question;
}

function formatString(text: string, data: QuestionDataType): string {
    let result;
    const textReg = /\$\{([\w\d_.-]+)\}/;
    while ((result = textReg.exec(text)) !== null) {
        const name = result[1];
        const reg = new RegExp('\\$\\{' + name + '\\}', 'g');
        const value = <string>_.get(data, name);
        // debug('string replace name=' + name + ', reg=', reg, 'value', value);
        text = text.replace(reg, value);
    }

    return text;
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
