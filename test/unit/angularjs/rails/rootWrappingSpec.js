describe('root wrapping', function () {
    'use strict';

    beforeEach(module('rails'));

    var q, rootScope,
        transformer, interceptor,
        config = {rootName: 'test', rootPluralName: 'tests'};


    function testTransform(wrappedData, unwrappedData) {
        var result, resultPromise,
            deferred = q.defer();

        expect(transformer(unwrappedData, config)).toEqualData(wrappedData);
        deferred.promise.resource = config;
        expect(resultPromise = interceptor(deferred.promise)).toBeDefined();

        resultPromise.then(function (response) {
            result = response;
        });

        deferred.resolve({data: wrappedData});
        rootScope.$digest(); // needed for $q to actually run callbacks
        expect(result).toEqualData({data: unwrappedData});
    }

    beforeEach(inject(function ($rootScope, $q, railsRootWrappingTransformer, railsRootWrappingInterceptor) {
        q = $q;
        rootScope = $rootScope;
        transformer = railsRootWrappingTransformer;
        interceptor = railsRootWrappingInterceptor;
    }));

    it('should handle null root', function() {
        testTransform({test: null}, null);
    });

    it('should transform arrays', function() {
        testTransform({tests: [1, 2, 3]}, [1, 2, 3]);
    });

    it('should transform object', function() {
        testTransform({test: {abc: 'xyz', def: 'abc'}}, {abc: 'xyz', def: 'abc'});
    });
});
