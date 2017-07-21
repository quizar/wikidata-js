
const assert = require('assert');
const { QuestionQuery } = require('../lib/question-query');

describe('QuestionQuery', function () {
    describe('#list', function () {
        it('should have a static function `list`', function () {
            assert.equal('function', typeof QuestionQuery.list);
        });
        it('should get an array of strings', function () {
            return QuestionQuery.list().then(list => {
                assert.equal(true, Array.isArray(list), 'list is not an array');
                assert.equal(true, list.length > 0, 'list has at least one item');
                // console.log('list', list)
            });
        });
    });
    describe('#get', function () {
        it('should have a static function `get`', function () {
            assert.equal('function', typeof QuestionQuery.get);
        });
        it('should get an QuestionQuery', function () {
            const name = 'country-membership-date';
            return QuestionQuery.get(name).then(query => {
                assert.equal('object', typeof query, 'query must be an object');
                assert.equal(name, query.data.name, 'data query name not equal with required name');
            });
        });
    });
    describe('#execute', function () {
        it('should have a static function `execute`', function () {
            assert.equal('function', typeof QuestionQuery.execute);
        });
        it('should execute an existing query: country-membership-date', function () {
            const name = 'country-membership-date';
            return QuestionQuery.execute(name, { subject: 'Q217' }).then(data => {
                assert.equal(true, Array.isArray(data), 'data must be an array');
                // assert.equal('Q', data[0].substr(0, 1), 'id must start with Q');
                // console.log(data);
            });
        });
    });
});