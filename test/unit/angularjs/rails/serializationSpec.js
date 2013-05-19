describe('railsUrlSerializer', function () {
    'use strict';
    var factory;

    beforeEach(module('rails'));

    beforeEach(inject(function (railsSerializer) {
        factory = railsSerializer;
    }));

    it('should support customizer being first parameter', function () {
        var called = false;

        factory(function () {
            called = true;
        });

        expect(called).toBeTruthy();
    });

    it('should support customizer with options as first parameter', function () {
        var called = false;

        factory({}, function () {
            called = true;
        });

        expect(called).toBeTruthy();

    });

    describe('default config', function () {
        var serializer;

        beforeEach(function() {
            serializer = factory();
        });

        it('should underscore attributes on single object', function () {
            var result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin'});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin'});
        });

        it('should underscore attributes on nested objects', function () {
            var result = serializer.serialize({id: 6, title: 'Winds of Winter', pages: 1105, publicationDate: '2020-05-25', author: {id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin'}});
            expect(result).toEqualData({id: 6, title: 'Winds of Winter', pages: 1105, publication_date: '2020-05-25', author: {id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin'}});
        });

        it('should underscore attribute inside array objects', function () {
            var result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', books: [{id: 1, title: 'A Game of Thrones', publicationDate: '1996-08-06'}]});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin', books: [{id: 1, title: 'A Game of Thrones', publication_date: '1996-08-06'}]});
        });

        it('should support primitive arrays', function () {
            var result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', books: [1, 2, 3]});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin', books: [1, 2, 3]});
        });

        it('should exclude attributes that start with $', function () {
            var result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', $birthDate: '1948-09-20'});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin'});
        });

        it('should exclude functions', function () {
            var result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', $books: [], getNumBooks: function () { this.$books.length }});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin'});
        });

    });

    describe('custom options', function () {
        it('should allow overriding attribute transformation function with undefined', function () {
            var test,
                serializer = factory({underscore: undefined});

            test = {id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin'};
            expect(serializer.serialize(test)).toEqualData(test);
        });

        it('should allow overriding attribute transformation with custom function', function () {
            var result,
                serializer = factory({underscore: function (attribute) { return 'x' + attribute}});

            result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin'});
            expect(result).toEqualData({xid: 1, xfirstName: 'George', xmiddleName: 'R. R.', xlastName: 'Martin'});
        });

        it('should allow safely ignore null excludePrefixes', function () {
            var result,
                serializer = factory({exclusionMatchers: null});

            result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', $birthDate: '1948-09-20'});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin', $birthDate: '1948-09-20'});
        });

        it('should allow safely ignore undefined excludePrefixes', function () {
            var result,
                serializer = factory({exclusionMatchers: undefined});

            result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', $birthDate: '1948-09-20'});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin', $birthDate: '1948-09-20'});
        });

        it('should allow empty excludePrefixes', function () {
            var result,
                serializer = factory({exclusionMatchers: []});

            result = serializer.serialize({id: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', $birthDate: '1948-09-20'});
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin', $birthDate: '1948-09-20'});
        });

        it('should treat exclusionMatcher strings as prefix exclusions', function () {
            var result,
                serializer = factory({exclusionMatchers: ['x']});

            result = serializer.serialize({xid: 1, firstNamex: 'George', middleName: 'R. R.', lastName: 'Martin', $birthDate: '1948-09-20'});
            expect(result).toEqualData({first_namex: 'George', middle_name: 'R. R.', last_name: 'Martin', $birthDate: '1948-09-20'});
        });

        it('should use combination of string prefix, function, and regexp for exclusions', function () {
            var result,
                serializer = factory({exclusionMatchers: ['x', /^$/, function (key) { return key === 'middleName'; }]});

            result = serializer.serialize({xid: 1, firstName: 'George', middleName: 'R. R.', lastName: 'Martin', $birthDate: '1948-09-20'});
            expect(result).toEqualData({first_name: 'George', last_name: 'Martin'});
        });
    });

    describe('customized serialization', function () {
        var author = {
            id: 1,
            firstName: 'George',
            middleName: 'R. R.',
            lastName: 'Martin',
            birthDate: '1948-09-20',
            books: [
                {id: 1, title: 'A Game of Thrones', pages: 694, series: 'A Song of Ice and Fire', publicationDate: '1996-08-06', authorId: 1},
                {id: 2, title: 'A Clash of Kings', pages: 768, series: 'A Song of Ice and Fire', publicationDate: '1999-03-01', authorId: 1},
            ]
        };

        it('should allow single exclusion', function () {
            var result,
                serializer = factory(function (config) {
                    config.exclude('books');
                });

            result = serializer.serialize(author);
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin', birth_date: '1948-09-20'});
        });

        it('should allow variable exclusions', function () {
            var result,
                serializer = factory(function (config) {
                    config.exclude('books', 'birthDate');
                });

            result = serializer.serialize(author);
            expect(result).toEqualData({id: 1, first_name: 'George', middle_name: 'R. R.', last_name: 'Martin'});
        });

        it('should allow renaming attributes', function () {
            var result,
                serializer = factory(function (config) {
                    // this & config should be interchangeable
                    this.exclude('books', 'birthDate');
                    this.rename('id', 'authorId');
                    this.rename('firstName', 'first');
                    this.rename('middleName', 'middle');
                    config.rename('lastName', 'last');
                });

            result = serializer.serialize(author);
            expect(result).toEqualData({author_id: 1, first: 'George', middle: 'R. R.', last: 'Martin'});
        });

        it('should allow nested attributes', function () {
            var result,
                serializer = factory(function () {
                    this.nestedAttribute('books')
                });

            result = serializer.serialize(author);
            expect(result['books_attributes']).toEqualData([
                {id: 1, title: 'A Game of Thrones', pages: 694, series: 'A Song of Ice and Fire', publication_date: '1996-08-06', author_id: 1},
                {id: 2, title: 'A Clash of Kings', pages: 768, series: 'A Song of Ice and Fire', publication_date: '1999-03-01', author_id: 1}
            ]);
        });

        it('should add custom attribute from function', function () {
            var result,
                serializer = factory(function () {
                    this.add('numBooks', function (author) {
                        return author.books.length;
                    });
                });

            result = serializer.serialize(author);
            expect(result['num_books']).toBe(2);
        });

        it('should add custom attribute from constant value', function () {
            var result,
                serializer = factory(function () {
                    this.add('numBooks', 2);
                });

            result = serializer.serialize(author);
            expect(result['num_books']).toBe(2);
        });
    });
});
