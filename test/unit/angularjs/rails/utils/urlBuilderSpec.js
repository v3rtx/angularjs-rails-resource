describe("railsUrlBuilder", function () {
    'use strict';

    beforeEach(module('rails'));

    it('should return custom function', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder(function () { return 'test' })()).toEqualData('test')
    }));

    it('should return base url when no context object', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder('/books')()).toEqualData('/books');
    }));

    it('should append id', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder('/books')({id: 1})).toEqualData('/books/1');
    }));

    it('should use author id for book list', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder('/authors/{{authorId}}/books/{{id}}')({authorId: 1})).toEqualData('/authors/1/books');
    }));

    it('should use author id and book id', inject(function (railsUrlBuilder) {
        expect(railsUrlBuilder('/authors/{{authorId}}/books/{{id}}')({authorId: 1, id: 2})).toEqualData('/authors/1/books/2');
    }));

    describe('custom interpolation symbols', function() {
        beforeEach(module(function($interpolateProvider) {
              $interpolateProvider.startSymbol('--');
              $interpolateProvider.endSymbol('--');
        }));

        it('should append id', inject(function (railsUrlBuilder) {
            expect(railsUrlBuilder('/books')({id: 1})).toEqualData('/books/1');
        }));

        it('should use author id and book id', inject(function (railsUrlBuilder) {
            expect(railsUrlBuilder('/authors/--authorId--/books/--id--')({authorId: 1, id: 2})).toEqualData('/authors/1/books/2');
        }));
    });
});
