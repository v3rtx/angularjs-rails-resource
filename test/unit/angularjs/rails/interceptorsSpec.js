describe('transformers', function () {
    'use strict';
    var $httpBackend, $rootScope, factory, Test, testInterceptor, testAfterInterceptor,
        config = {
            url: '/test',
            name: 'test'
        };

    beforeEach(function () {
        module('rails');

        angular.module('rails').factory('railsTestInterceptor', function () {
            return function (promise) {
                return promise.then(function (response) {
                    response.data.interceptorAdded = 'x';
                    return response;
                });
            }
        });

        angular.module('rails').factory('railsTestAfterInterceptor', function () {
            return function (promise) {
                return promise.then(function (resource) {
                    resource.interceptorAdded = 'x';
                    return resource;
                });
            }
        });
    });

    beforeEach(inject(function (_$httpBackend_, _$rootScope_, railsResourceFactory, railsTestInterceptor, railsTestAfterInterceptor) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        factory = railsResourceFactory;
        Test = railsResourceFactory(config);
        testInterceptor = railsTestInterceptor;
        testAfterInterceptor = railsTestAfterInterceptor;
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('before response', function () {
        it('should be able to reference interceptor using name', function () {
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

        it('should be able to add interceptor using reference', function () {
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

        it('should be able to add interceptor using beforeResponse', function () {
            var promise, result, Resource, interceptorCalled = false;

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            Resource = factory(config);

            Resource.beforeResponse(function (resource, constructor, context) {
                expect(resource).toEqualData({id: 123, abcDef: 'xyz'});
                expect(constructor).toEqual(Resource);
                expect(context).toBeUndefined();
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

        it('should set context to resource instance', function () {
            var instance, Resource, interceptorCalled = false;

            $httpBackend.expectPOST('/test').respond(200, {id: 123, abc_def: 'xyz'});

            Resource = factory(config);

            instance = new Resource({abcDef: 'xyz'});

            Resource.beforeResponse(function (resource, constructor, context) {
                expect(resource).toEqualData({id: 123, abcDef: 'xyz'});
                expect(constructor).toEqual(Resource);
                expect(context).toBeInstanceOf(Resource);
                expect(context).toEqualData(instance);
                interceptorCalled = true;
            });

            instance.save();

            $httpBackend.flush();

            expect(interceptorCalled).toBeTruthy();
        });
    });

    describe('after response', function () {
        it('should be able to reference interceptor using name', function () {
            var promise, result, Resource, testConfig = {};

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            angular.copy(config, testConfig);
            testConfig.afterResponseInterceptors = ['railsTestAfterInterceptor'];
            Resource = factory(testConfig);

            expect(promise = Resource.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Resource);
            expect(result).toEqualData({interceptorAdded: 'x', id: 123, abcDef: 'xyz'});
        });

        it('should be able to add interceptor using reference', function () {
            var promise, result, Resource, testConfig = {};

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});


            angular.copy(config, testConfig);
            testConfig.afterResponseInterceptors = [testAfterInterceptor];
            Resource = factory(testConfig);

            expect(promise = Resource.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Resource);
            expect(result).toEqualData({interceptorAdded: 'x', id: 123, abcDef: 'xyz'});
        });

        it('should be able to add interceptor using afterResponse', function () {
            var promise, result, Resource, interceptorCalled = false;

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            Resource = factory(config);

            Resource.afterResponse(function (resource, constructor, context) {
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

        it('should set context to resource instance', function () {
            var instance, Resource, interceptorCalled = false;

            $httpBackend.expectPOST('/test').respond(200, {id: 123, abc_def: 'xyz'});

            Resource = factory(config);

            instance = new Resource({abcDef: 'xyz'});

            Resource.afterResponse(function (resource, constructor, context) {
                expect(resource).toEqualData({id: 123, abcDef: 'xyz'});
                expect(constructor).toEqual(Resource);
                interceptorCalled = true;
            });

            instance.save();

            $httpBackend.flush();

            expect(interceptorCalled).toBeTruthy();
        });
    });


});
