describe('interceptors', function () {
    'use strict';
    var $q, $httpBackend, $rootScope, factory, Test, testInterceptor, testAfterInterceptor, testRequestTransformer,
        deprecatedTestInterceptor, deprecatedTestAfterInterceptor,
        config = {
            url: '/test',
            name: 'test'
        };

    beforeEach(function () {
        module('rails');

        angular.module('rails').factory('deprecatedRailsTestInterceptor', function () {
            return function (promise) {
                return promise.then(function (response) {
                    response.data.interceptorAdded = 'x';
                    return response;
                });
            }
        });

        angular.module('rails').factory('deprecatedRailsTestAfterInterceptor', function () {
            return function (promise) {
                return promise.then(function (resource) {
                    resource.interceptorAdded = 'x';
                    return resource;
                });
            }
        });
        angular.module('rails').factory('railsTestInterceptor', function () {
            return {
                'response': function (response) {
                    response.data.interceptorAdded = 'x';
                    return response;
                },
                'responseError': function (rejection) {
                    rejection.interceptorCalled = true;
                    return $q.reject(rejection);
                }
            };
        });

        angular.module('rails').factory('railsTestAfterInterceptor', function () {
            return {
                'afterResponse': function (response) {
                    response.interceptorAdded = 'x';
                    return response;
                }
            };
        });

        angular.module('rails').factory('railsTestRequestTransformer', function () {
            return {
                'beforeRequest': function (httpConfig, resource) {
                    httpConfig.data.transformer_called = true;
                    return httpConfig;
                }
            };
        });

    });

    beforeEach(inject(function (_$q_, _$httpBackend_, _$rootScope_, railsResourceFactory,
                                railsTestInterceptor, railsTestAfterInterceptor, railsTestRequestTransformer,
                                deprecatedRailsTestInterceptor, deprecatedRailsTestAfterInterceptor) {
        $q = _$q_;
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        factory = railsResourceFactory;
        Test = railsResourceFactory(config);
        testInterceptor = railsTestInterceptor;
        testAfterInterceptor = railsTestAfterInterceptor;
        deprecatedTestInterceptor = deprecatedRailsTestInterceptor;
        deprecatedTestAfterInterceptor = deprecatedRailsTestAfterInterceptor;
        testRequestTransformer = railsTestRequestTransformer;
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('deprecated before response', function () {
        it('should be able to reference interceptor using name', function () {
            var promise, result, Resource, testConfig = {};

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            angular.copy(config, testConfig);
            testConfig.responseInterceptors = ['deprecatedRailsTestInterceptor'];
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
            testConfig.responseInterceptors = [deprecatedTestInterceptor];
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

    describe('response', function () {
        it('should be able to reference interceptor using name', function () {
            var promise, result, Resource, testConfig = {};

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            angular.copy(config, testConfig);
            Resource = factory(testConfig);
            Resource.addInterceptor('railsTestInterceptor');

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
            Resource = factory(testConfig);
            Resource.addInterceptor(testInterceptor);

            expect(promise = Resource.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            });

            $httpBackend.flush();

            expect(result).toBeInstanceOf(Resource);
            expect(result).toEqualData({interceptorAdded: 'x', id: 123, abcDef: 'xyz'});
        });

        it('should execute error interceptors on HTTP error', function () {
            var promise, result, rejection, Resource, testConfig = {};

            $httpBackend.expectGET('/test/123').respond(500);

            angular.copy(config, testConfig);
            Resource = factory(testConfig);
            Resource.addInterceptor(testInterceptor);

            expect(promise = Resource.get(123)).toBeDefined();

            promise.then(function (response) {
                result = response;
            }, function (error) {
                rejection = error;
            });

            $httpBackend.flush();

            expect(result).not.toBeDefined();
            expect(rejection).toBeDefined();
            expect(rejection.interceptorCalled).toBeTruthy();
        });

        it('should be able to add interceptor using interceptResponse', function () {
            var promise, result, Resource, interceptorCalled = false;

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            Resource = factory(config);

            Resource.interceptResponse(function (response, constructor, context) {
                expect(response.data).toEqualData({id: 123, abcDef: 'xyz'});
                expect(constructor).toEqual(Resource);
                expect(context).toBeUndefined();
                interceptorCalled = true;
                return response;
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

            Resource.interceptResponse(function (response, constructor, context) {
                expect(response.data).toEqualData({id: 123, abcDef: 'xyz'});
                expect(constructor).toEqual(Resource);
                expect(context).toBeInstanceOf(Resource);
                expect(context).toEqualData(instance);
                interceptorCalled = true;
                return response;
            });

            instance.save();

            $httpBackend.flush();

            expect(interceptorCalled).toBeTruthy();
        });
    });

    describe('deprecated after response', function () {
        it('should be able to reference interceptor using name', function () {
            var promise, result, Resource, testConfig = {};

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            angular.copy(config, testConfig);
            testConfig.afterResponseInterceptors = ['deprecatedRailsTestAfterInterceptor'];
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
            testConfig.afterResponseInterceptors = [deprecatedTestAfterInterceptor];
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

    describe('after response', function () {
        it('should be able to reference interceptor using name', function () {
            var promise, result, Resource, testConfig = {};

            $httpBackend.expectGET('/test/123').respond(200, {id: 123, abc_def: 'xyz'});

            angular.copy(config, testConfig);
            testConfig.interceptors = ['railsTestAfterInterceptor'];
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
            testConfig.interceptors = [testAfterInterceptor];
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

            Resource.interceptAfterResponse(function (resource, constructor, context) {
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

            Resource.interceptAfterResponse(function (resource, constructor, context) {
                expect(resource).toEqualData({id: 123, abcDef: 'xyz'});
                expect(constructor).toEqual(Resource);
                interceptorCalled = true;
            });

            instance.save();

            $httpBackend.flush();

            expect(interceptorCalled).toBeTruthy();
        });
    });

    describe('before request wrapping', function () {
        it('should be able to add transformer using name', function() {
            var Resource, testConfig = {};

            $httpBackend.expectPOST('/test/123', {test: {id: 123, transformer_called: true}}).respond(200, {id: 123, abc_def: 'xyz'});

            angular.copy(config, testConfig);
            testConfig.interceptors = ['railsTestRequestTransformer'];
            Resource = factory(testConfig);
            new Resource({id: 123}).create();

            $httpBackend.flush();
        });

        it('should be able to add transformer using reference', function() {
            var Resource, testConfig = {};

            $httpBackend.expectPOST('/test/123', {test: {id: 123, transformer_called: true}}).respond(200, {id: 123, abc_def: 'xyz'});

            angular.copy(config, testConfig);
            testConfig.interceptors = [testRequestTransformer];
            Resource = factory(testConfig);
            new Resource({id: 123}).create();

            $httpBackend.flush();
        });

        it('should call transformer function with beforeRequest', function () {
            var Resource, transformerCalled = false;

            $httpBackend.expectPOST('/test/123', {test: {id: 123}}).respond(200, {id: 123, abc_def: 'xyz'});

            Resource = factory(config);
            Resource.interceptBeforeRequest(function (httpConfig, constructor) {
                expect(httpConfig.data).toEqualData({id: 123});
                expect(constructor).toEqual(Resource);
                transformerCalled = true;
                return httpConfig;
            });

            new Resource({id: 123}).create();

            $httpBackend.flush();
            expect(transformerCalled).toBeTruthy();
        });

        it('should be able to return new data from beforeRequest function', function () {
            var Resource, transformerCalled = false;

            $httpBackend.expectPOST('/test/123', {test: {id: 1}}).respond(200, {id: 123, abc_def: 'xyz'});

            Resource = factory(config);
            Resource.interceptBeforeRequest(function (httpConfig, resource) {
                expect(httpConfig.data).toEqualData({id: 123});
                expect(resource).toEqual(Resource);
                transformerCalled = true;
                httpConfig.data = {id: 1};
                return httpConfig;
            });

            new Resource({id: 123}).create();

            $httpBackend.flush();
            expect(transformerCalled).toBeTruthy();
        });
    });
});
