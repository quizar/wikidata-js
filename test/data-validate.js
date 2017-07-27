
const assert = require('assert');
const { validateSubject, validateQuestion } = require('../lib/data-validator');
const { WikidataQuery } = require('../lib/wikidata-query');

describe('data-validate', function () {
    it('valid subjects', function () {
        return WikidataQuery.list('subject').each(id => WikidataQuery.getTemplate('subject', id).then(data => validateSubject(data)));
    });
    it('valid questions', function () {
        return WikidataQuery.list('question').each(id => WikidataQuery.getTemplate('question', id).then(data => validateQuestion(data)));
    });
});
