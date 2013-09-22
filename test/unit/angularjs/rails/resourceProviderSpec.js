describe('resource provider factory config', function () {
    'use strict';

    it('should allow disabling root wrapping globally', function () {
        module('rails', function (railsResourceFactoryProvider) {
            expect(railsResourceFactoryProvider.rootWrapping(false)).toBe(railsResourceFactoryProvider);
        });

        inject(function (railsResourceFactory) {
            expect(railsResourceFactory({name: 'test', url: '/test'}).config.rootWrapping).toBe(false);
        });
    });

    it('should allow setting updateMethod globally', function () {
        module('rails', function (railsResourceFactoryProvider) {
            expect(railsResourceFactoryProvider.updateMethod('patch')).toBe(railsResourceFactoryProvider);
        });

        inject(function (railsResourceFactory) {
            expect(railsResourceFactory({name: 'test', url: '/test'}).config.updateMethod).toBe('patch');
        });
    });

    it('should allow setting http headers options globally', function () {
        module('rails', function (railsResourceFactoryProvider) {
            expect(railsResourceFactoryProvider.httpConfig({headers: {'test': "header"}})).toBe(railsResourceFactoryProvider);
        });

        inject(function (railsResourceFactory) {
            expect(railsResourceFactory({name: 'test', url: '/test'}).config.httpConfig.headers).toEqualData({'Accept': 'application/json', 'Content-Type': 'application/json', 'test': 'header'});
        });
    });

    it('should allow setting default query parameters options globally', function () {
        module('rails', function (railsResourceFactoryProvider) {
            expect(railsResourceFactoryProvider.defaultParams({'test': "1"})).toBe(railsResourceFactoryProvider);
        });

        inject(function (railsResourceFactory) {
            expect(railsResourceFactory({name: 'test', url: '/test'}).config.defaultParams).toEqualData({'test': '1'});
        });
    });
});
