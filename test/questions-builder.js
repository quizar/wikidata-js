
const assert = require('assert');
const { QuestionsBuilder } = require('../lib/questions-builder');
const { Bluebird } = require('../lib/utils');

describe('QuestionsBuilder', function () {
    it('should build questions', function () {
        this.timeout(1000 * 60);
        return new Bluebird((resolve, reject) => {
            const builder = new QuestionsBuilder({ lang: 'ro', queries: [{ id: 'country-membership-date' }] });
            builder
                .on('end', resolve)
                .on('error', reject)
                .on('question', (question, next) => {
                    // console.log('got question', parseInt(Date.now() / 1000), question.question, question.values);
                    next();
                }).start();
        });
    });
});
