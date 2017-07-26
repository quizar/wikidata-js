
const assert = require('assert');
const { validateSubject, validateQuestion } = require('../lib/data-validator');
const { SubjectQuery } = require('../lib/subject-query');
const { QuestionQuery } = require('../lib/question-query');

describe('data-validate', function () {
    it('valid subjects', function () {
        return SubjectQuery.list().each(id => SubjectQuery.getDataInfo(id).then(data => validateSubject(data)));
    });
    it('valid questions', function () {
        return QuestionQuery.list().each(id => QuestionQuery.getDataInfo(id).then(data => validateQuestion(data)));
    });
});
