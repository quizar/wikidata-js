
const assert = require('assert');
const { QuestionsBuilder } = require('../lib/question/builder');
const { QuestionQuery } = require('../lib/question-query');
const { Bluebird } = require('../lib/utils');

describe('QuestionsBuilder', function () {
    it('should build questions', function () {
        this.timeout(1000 * 60);
        return QuestionQuery.get('country-membership-date')
            .then(query => query.execute({ subject: 'Q217' })
                .then(items => {
                    return new Bluebird((resolve, reject) => {
                        const builder = new QuestionsBuilder(query.data, items, 'ro');
                        builder
                            .on('end', resolve)
                            .on('error', reject)
                            .on('question', (question, next) => {
                                // console.log('got question', parseInt(Date.now() / 1000), question.question, question.values);
                                next();
                            }).start();
                    });
                }));
    });
});
