
const assert = require('assert');
const { QuestionQuery } = require('../lib/question-query');

describe('QuestionQuery', function () {
    describe('#get', function () {
        it('should have a static function `get`', function () {
            assert.equal('function', typeof QuestionQuery.get);
        });
        it('should get an QuestionQuery', function () {
            const id = 'country-membership-date';
            return QuestionQuery.get(id).then(query => {
                assert.equal('object', typeof query, 'query must be an object');
                assert.equal(id, query.template.id, 'data query id not equal with required id');
            });
        });
    });
    describe('#execute', function () {
        it('should execute an existing query: country-membership-date', function () {
            const id = 'country-membership-date';
            return QuestionQuery.get(id).then(query => query.execute({ subject: 'Q217' }).then(data => {
                assert.equal(true, Array.isArray(data), 'data must be an array');
                // assert.equal('Q', data[0].substr(0, 1), 'id must start with Q');
                // console.log(data);
            }));
        });
    });
});
