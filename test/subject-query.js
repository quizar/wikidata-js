
const assert = require('assert');
const { SubjectQuery } = require('../lib/subject-query');

describe('SubjectQuery', function () {
    describe('#list', function () {
        it('should have a static function `list`', function () {
            assert.equal('function', typeof SubjectQuery.list);
        });
        it('should get an array of strings', function () {
            return SubjectQuery.list().then(list => {
                assert.equal(true, Array.isArray(list), 'list is not an array');
                assert.equal(true, list.length > 0, 'list has at least one item');
                // console.log('list', list)
            });
        });
    });
    describe('#get', function () {
        it('should have a static function `get`', function () {
            assert.equal('function', typeof SubjectQuery.get);
        });
        it('should get an SubjectQuery', function () {
            const name = 'countries';
            return SubjectQuery.get(name).then(countriesQuery => {
                assert.equal('object', typeof countriesQuery, 'countriesQuery must be an object');
                assert.equal(name, countriesQuery.data.name, 'data query name not equal with required name');
            });
        });
    });
    describe('#execute', function () {
        it('should have a static function `execute`', function () {
            assert.equal('function', typeof SubjectQuery.execute);
        });
        it('should execute an existing query: countries', function () {
            const name = 'countries';
            return SubjectQuery.execute(name).then(countries => {
                assert.equal(true, Array.isArray(countries), 'countries must be an array');
                assert.equal('Q', countries[0].substr(0, 1), 'id must start with Q');
            });
        });
    });
});