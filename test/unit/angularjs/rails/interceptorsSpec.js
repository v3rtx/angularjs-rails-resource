describe('transformers', function () {
    'use strict';
    var $httpBackend, $rootScope, factory, Test, testInterceptor,
        config = {
            url: '/test',
            name: 'test'
        };

    beforeEach(function() {
        module('rails');

        angular.module('rails').factory('railsTestInterceptor', function () {
            return function (promise) {
                return promise.then(function (response) {
                    response.data.interceptorAdded = 'x';
                    return response;
                });
            }
        });
    });

    beforeEach(inject(function (_$httpBackend_, _$rootScope_, railsResourceFactory, railsTestInterceptor) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        factory = railsResourceFactory;
        Test = railsResourceFactory(config);
        testInterceptor = railsTestInterceptor;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });


    it('should be able to reference interceptor using name', function() {
        var promise, result, Resource, testConfig = {};

        $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

        angular.copy(config, testConfig);
        testConfig.responseInterceptors = ['railsTestInterceptor'];
        Resource = factory(testConfig);

        expect(promise = Resource.get(123)).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(Resource);
        expect(result).toEqualData({interceptorAdded: 'x', id: 123, abcDef: 'xyz'});
    });

    it('should be able to add interceptor using reference', function() {
        var promise, result, Resource, testConfig = {};

        $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});


        angular.copy(config, testConfig);
        testConfig.responseInterceptors = [testInterceptor];
        Resource = factory(testConfig);

        expect(promise = Resource.get(123)).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(Resource);
        expect(result).toEqualData({interceptorAdded: 'x', id: 123, abcDef: 'xyz'});
    });    
    
    it('should be able to add interceptor using beforeResponse', function() {
        var promise, result, Resource, interceptorCalled = false;

        $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

        Resource = factory(config);

        Resource.beforeResponse(function (resource, constructor) {
            expect(resource).toEqualData({id: 123, abcDef: 'xyz'});
            expect(constructor).toEqual(Resource);
            interceptorCalled = true;
        });

        expect(promise = Resource.get(123)).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();

        expect(result).toBeInstanceOf(Resource);
        expect(result).toEqualData({id: 123, abcDef: 'xyz'});
        expect(interceptorCalled).toBeTruthy();
    });

});
