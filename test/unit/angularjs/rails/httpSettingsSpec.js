describe('http setting', function () {
    'use strict';

    beforeEach(module('rails'));

    var $httpBackend, $rootScope, factory,
        config = {
            url: '/test',
            name: 'test'
        };

    beforeEach(inject(function (_$httpBackend_, _$rootScope_, railsResourceFactory) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        factory = railsResourceFactory;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    function headerComparison(expectedHeaders) {
        return function(headers) {
            var matches = true;

            angular.forEach(expectedHeaders, function (value, key) {
                if (headers[key] !== value) {
                    matches = false;
                }
            });

            return matches;
        };
    }

    it('query should pass default $http options', inject(function($httpBackend) {
        var promise, result, Test;

        $httpBackend.expectGET('/test', headerComparison({'Accept': 'application/json'})).respond(200, {test: {abc: 'xyz'}});

        Test = factory(config);
        expect(promise = Test.query()).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();
    }));

    it('query should allow custom Accept', inject(function($httpBackend) {
        var promise, result, Test;

        $httpBackend.expectGET('/test', headerComparison({'Accept': 'text/plain'})).respond(200, {test: {abc: 'xyz'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'Accept': 'text/plain'}}}));
        expect(promise = Test.query()).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();
    }));

    it('query should allow custom header', inject(function($httpBackend) {
        var promise, result, Test;

        $httpBackend.expectGET('/test', headerComparison({'Accept': 'application/json', 'X-Test': 'test'})).respond(200, {test: {abc: 'xyz'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'X-Test': 'test'}}}));
        expect(promise = Test.query()).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();
    }));

    it('get should pass default $http options', inject(function($httpBackend) {
        var promise, result, Test;

        $httpBackend.expectGET('/test/123', headerComparison({'Accept': 'application/json'})).respond(200, {test: {abc: 'xyz'}});

        Test = factory(config);
        expect(promise = Test.get(123)).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();
    }));

    it('get should allow custom Accept', inject(function($httpBackend) {
        var promise, result, Test;

        $httpBackend.expectGET('/test/123', headerComparison({'Accept': 'text/plain'})).respond(200, {test: {abc: 'xyz'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'Accept': 'text/plain'}}}));
        expect(promise = Test.get(123)).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();
    }));

    it('get should allow custom header', inject(function($httpBackend) {
        var promise, result, Test;

        $httpBackend.expectGET('/test/123', headerComparison({'Accept': 'application/json', 'X-Test': 'test'})).respond(200, {test: {abc: 'xyz'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'X-Test': 'test'}}}));
        expect(promise = Test.get(123)).toBeDefined();

        promise.then(function (response) {
            result = response;
        });

        $httpBackend.flush();
    }));

    it('create should pass default $http options', inject(function($httpBackend) {
        var Test;

        $httpBackend.expectPOST('/test', {test: {xyz: '123'}}, headerComparison({'Accept': 'application/json', 'Content-Type': 'application/json'})).respond(200, {test: {id: 123, xyz: '123'}});

        Test = factory(config);
        var test = new Test();
        test.xyz = '123';
        test.create();

        $httpBackend.flush();
    }));

    it('create should allow custom Accept', inject(function($httpBackend) {
        var Test;

        $httpBackend.expectPOST('/test', {test: {xyz: '123'}}, headerComparison({'Accept': 'text/plain'})).respond(200, {test: {id: 123, xyz: '123'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'Accept': 'text/plain'}}}));
        var test = new Test();
        test.xyz = '123';
        test.create();

        $httpBackend.flush();
    }));

    it('create should allow custom header', inject(function($httpBackend) {
        var Test;

        $httpBackend.expectPOST('/test', {test: {xyz: '123'}}, headerComparison({'Accept': 'application/json', 'X-Test': 'test'})).respond(200, {test: {id: 123, xyz: '123'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'X-Test': 'test'}}}));
        var test = new Test();
        test.xyz = '123';
        test.create();

        $httpBackend.flush();
    }));

    it('update should pass default $http options', inject(function($httpBackend) {
        var Test;

        $httpBackend.expectPUT('/test/123', {test: {id: 123, xyz: '123'}}, headerComparison({'Accept': 'application/json', 'Content-Type': 'application/json'})).respond(200, {test: {id: 123, xyz: '123'}});

        Test = factory(config);
        var test = new Test();
        test.id = 123;
        test.xyz = '123';
        test.update();

        $httpBackend.flush();
    }));

    it('update should allow custom Accept', inject(function($httpBackend) {
        var Test;

        $httpBackend.expectPUT('/test/123', {test: {id: 123, xyz: '123'}}, headerComparison({'Accept': 'text/plain'})).respond(200, {test: {id: 123, xyz: '123'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'Accept': 'text/plain'}}}));
        var test = new Test();
        test.id = 123;
        test.xyz = '123';
        test.update();

        $httpBackend.flush();
    }));

    it('update should allow custom header', inject(function($httpBackend) {
        var Test;

        $httpBackend.expectPUT('/test/123', {test: {id: 123, xyz: '123'}}, headerComparison({'Accept': 'application/json', 'X-Test': 'test'})).respond(200, {test: {id: 123, xyz: '123'}});

        Test = factory(angular.extend(angular.copy(config), {httpConfig: {headers: {'X-Test': 'test'}}}));
        var test = new Test();
        test.id = 123;
        test.xyz = '123';
        test.update();

        $httpBackend.flush();
    }));

    it('$patch should pass default $http options', inject(function($httpBackend) {
        var Test;

        $httpBackend.expectPATCH('/test/123', {test: {id: 123, xyz: '123'}}, headerComparison({'Accept': 'application/json', 'Content-Type': 'application/json'})).respond(200, {test: {id: 123, xyz: '123'}});

        Test = factory(config);
        Test.$patch('/test/123', {id: 123, xyz: '123'});

        $httpBackend.flush();
    }));

});