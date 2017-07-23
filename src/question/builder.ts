
const debug = require('debug')('quizar-wikidata');

import { QuestionQueryData, QuestionInfo, QuestionInfoData, QuestionInfoValueType } from '../question-query';
import { Question, QuestionSource, QuestionSourceData, PropertyValueType } from 'quizar-domain';
import { Bluebird, AnyPlainObject, _, StringPlainObject } from '../utils';
import { buildQuestionData, QuestionDataType } from './build-question-data';
import { convertLocalEntityToDomainEntity } from '../entity/converter';

export function buildQuestions(data: QuestionQueryData, items: StringPlainObject[], lang?: string): Bluebird<Question[]> {
    let questions: Question[] = [];

    return Bluebird.each(data.questions, qinfo => {
        const questionDatas = items.map(item => <QuestionInfoData>setDataValues(qinfo.data, item));
        const dataGroup = _.groupBy(questionDatas, (item) => {
            const key = qinfo.value.groupBy.map(groupBy => _.get(item, groupBy));
            // debug('groupby key', key);
            return key.join('-');
        });
        // debug('dataGroup', dataGroup);
        return Bluebird.each(Object.keys(dataGroup),
            groupKey => langBuildQuestions(qinfo, dataGroup[groupKey], lang)
                .then(qs => {
                    if (qs && qs.length) {
                        questions = questions.concat(qs)
                        debug('ADDED questions ' + qs.length);
                    } else {
                        debug('NO qs');
                    }
                }));
    }).then(() => questions);
}

function langBuildQuestions(qinfo: QuestionInfo, qdata: QuestionInfoData[], lang?: string): Bluebird<Question[]> {
    debug('building question from', qinfo.id, qdata);
    if (qinfo.value.max && qinfo.value.max > qdata.length) {
        return Bluebird.reject(new Error('Question ' + qinfo.id + ' has too many data values'));
    }
    if (qinfo.value.min && qinfo.value.min < qdata.length) {
        return Bluebird.reject(new Error('Question ' + qinfo.id + ' has insufficient data values'));
    }
    const langs = (!!lang) ? [lang] : Object.keys(qinfo.info);
    return Bluebird.map(langs, l => {
        if (!qinfo.info[l]) {
            return Bluebird.reject(new Error('Invalid lang=' + l));
        }
        return buildQuestionData(l, qdata[0]).then(data => {
            // debug('got data', data);
            return buildQuestion(l, qinfo, qdata, data);
        });
    });
}

function buildQuestion(lang: string, qinfo: QuestionInfo, qdata: QuestionInfoData[], entityData: QuestionDataType): Question {
    const question: Question = {
        lang: lang,
        difficulty: qinfo.difficulty,
        format: qinfo.format,
        topics: qinfo.topics.map(item => convertLocalEntityToDomainEntity(_.get(entityData, item))),
        valueType: getValueType(qinfo.value.type),
        values: qdata.map(item => { return { value: <string>_.get(item, qinfo.value.data) } })
    };

    const info = qinfo.info[lang];
    if (info.question) {
        question.question = formatString(info.question, entityData);
    }
    if (info.title) {
        question.title = formatString(info.title, entityData);
    }

    debug('built question', question);

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
