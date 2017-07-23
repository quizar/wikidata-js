
const assert = require('assert');
const { buildQuestions } = require('../lib/question/builder');
const { QuestionQuery } = require('../lib/question-query');

describe('QuestionBuilder', function () {
    it('should build questions', function () {
        this.timeout(1000 * 60);
        return QuestionQuery.get('country-membership-date')
            .then(query => query.execute({ subject: 'Q217' })
                .then(items => {
                    return buildQuestions(query.data, items, 'ro')
                        .then(questions => {
                            assert.equal(true, questions.length > 0);
                        });
                }));
    });
});
