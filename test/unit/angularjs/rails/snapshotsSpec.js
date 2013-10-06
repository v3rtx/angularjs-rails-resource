describe('RailsResource.snapshots', function () {
    'use strict';
    var Book, $httpBackend;

    beforeEach(function () {
        module('rails')
    });

    beforeEach(inject(function (_$httpBackend_, railsResourceFactory) {
        $httpBackend = _$httpBackend_;
        Book = railsResourceFactory({
            url: '/books',
            name: 'book'
        });
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should store all keys', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();

        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(1);
        expect(book.$snapshots[0].$snapshots).toBeUndefined();
        expect(book).toEqualData(data);
        expect(book.$snapshots[0].$key).toBe('1234');
        expect(book.$snapshots[0]).toEqualData(data);
    });

    it('should store deep copy', function () {
        var book, data = {
            id: 1,
            $key: '1234',
            name: 'The Winds of Winter',
            author: {
                id: 1,
                name: 'George R. R. Martin'
            }
        };

        book = new Book(data);
        book.snapshot();

        expect(book.$snapshots[0].author).toBeDefined();
        expect(book.$snapshots[0]).toEqualData(data);
    });

    it('should store multiple snapshots', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();

        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(3);
        expect(book.$snapshots[0].$key).toBe('1234');
        expect(book.$snapshots[1].$key).toBe('1235');
        expect(book.$snapshots[2].$key).toBe('1236');
    });

    it('should rollback single version', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.rollback();

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(1);
    });

    it('should rollback deep copy', function () {
        var book, data = {
            id: 1,
            $key: '1234',
            name: 'The Winds of Winter',
            author: {
                id: 1,
                name: 'George R. R. Martin'
            }
        };

        book = new Book(data);
        book.snapshot();
        book.author = {id: 2, name: 'Hugh Howey'};
        book.rollback();

        expect(book.author).toBeDefined();
        expect(book).toEqualData(data);

        book.snapshot();
        book.author.name = 'Hugh Howey';
        book.rollback();

        expect(book.author).toBeDefined();
        expect(book).toEqualData(data);
    });


    it('should allow multiple rollbacks', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.rollback();

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(1);
        book.rollback();

        expect(book.$key).toBe('1234');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(0);
    });


    it('should rollback specified number of versions', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.$key = '1237';
        book.rollback(2);

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(1);
    });

    it('should not change resource on rollback if no snapshots saved', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.$key = '1235';
        book.rollback();

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(0);
    });

    it('should roll back to the first snapshot for -1', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.rollback(-1);

        expect(book.$key).toBe('1234');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(0);
    });

    it('should roll back to the first snapshot when versions exceeds available snapshots', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';
        book.snapshot();
        book.$key = '1236';
        book.snapshot();
        book.rollback(1000);

        expect(book.$key).toBe('1234');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(0);
    });

    it('should not change resource if number of versions is negative', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.$key = '1235';
        book.snapshot();
        book.rollback(-5);

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(1);
    });

    it('should reset snapshots on create', function () {
        var book, data = {$key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';

        $httpBackend.expectPOST('/books').respond(200, {book: {id: 1}});
        book.save();
        $httpBackend.flush();

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(0);
    });

    it('should reset snapshots on update', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';

        $httpBackend.expectPUT('/books/1').respond(200, {book: {id: 1}});
        book.save();
        $httpBackend.flush();

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(0);
    });

    it('should reset snapshots on delete', function () {
        var book, data = {id: 1, $key: '1234', name: 'The Winds of Winter'};
        book = new Book(data);
        book.snapshot();
        book.$key = '1235';

        $httpBackend.expectDELETE('/books/1').respond(200, {book: {id: 1}});
        book.delete();
        $httpBackend.flush();

        expect(book.$key).toBe('1235');
        expect(book.$snapshots).toBeDefined();
        expect(book.$snapshots.length).toBe(0);
    });
});