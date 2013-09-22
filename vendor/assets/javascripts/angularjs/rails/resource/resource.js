(function (undefined) {
    angular.module('rails').factory('railsRootWrappingTransformer', function () {
        return function (data, resource) {
            var result = {};
            result[angular.isArray(data) ? resource.config.pluralName : resource.config.name] = data;
            return result;
        };
    });

    angular.module('rails').factory('railsRootWrappingInterceptor', function () {
        return function (promise) {
            var resource = promise.resource;

            if (!resource) {
                return promise;
            }

            return promise.then(function (response) {
                if (response.data && response.data.hasOwnProperty(resource.config.name)) {
                    response.data = response.data[resource.config.name];
                } else if (response.data && response.data.hasOwnProperty(resource.config.pluralName)) {
                    response.data = response.data[resource.config.pluralName];
                }

                return response;
            });
        };
    });

    angular.module('rails').provider('railsResourceFactory', function () {
        var defaultOptions = {
            rootWrapping: true,
            updateMethod: 'put',
            httpConfig: {},
            defaultParams: undefined
        };

        this.rootWrapping = function (value) {
            defaultOptions.rootWrapping = value;
            return this;
        };

        this.updateMethod = function (value) {
            defaultOptions.updateMethod = value;
            return this;
        };

        this.httpConfig = function (value) {
            defaultOptions.httpConfig = value;
            return this;
        };

        this.defaultParams = function (value) {
            defaultOptions.defaultParams = value;
            return this;
        };

        this.$get = ['$http', '$q', 'railsUrlBuilder', 'railsSerializer', 'railsRootWrappingTransformer', 'railsRootWrappingInterceptor', 'RailsResourceInjector',
            function ($http, $q, railsUrlBuilder, railsSerializer, railsRootWrappingTransformer, railsRootWrappingInterceptor, RailsResourceInjector) {

            function railsResourceFactory(config) {
                var previousUrl;

                function appendPath(url, path) {
                    if (path) {
                        if (path[0] !== '/') {
                            url += '/';
                        }

                        url += path;
                    }

                    return url;
                }

                function forEachDependency(list, callback) {
                    var dependency;

                    for (var i = 0, len = list.length; i < len; i++) {
                        dependency = list[i];

                        if (angular.isString(dependency)) {
                            dependency = list[i] = RailsResourceInjector.getDependency(dependency);
                        }

                        callback(dependency);
                    }
                }

                function RailsResource(value) {
                    var instance = this;
                    if (value) {
                        var immediatePromise = function(data) {
                            return {
                                resource: RailsResource,
                                context: instance,
                                response: data,
                                then: function(callback) {
                                    this.response = callback(this.response, this.resource, this.context);
                                    return immediatePromise(this.response);
                                }
                            }
                        };

                        var data = RailsResource.callInterceptors(immediatePromise({data: value}), this).response.data;
                        angular.extend(this, data);
                    }
                }

                // allow calling resource factory with no options for inherited resource scenarios
                config = config || {};
                RailsResource.config = {};
                RailsResource.config.url = config.url;
                RailsResource.config.rootWrapping = config.rootWrapping === undefined ? defaultOptions.rootWrapping : config.rootWrapping; // using undefined check because config.rootWrapping || true would be true when config.rootWrapping === false
                RailsResource.config.httpConfig = config.httpConfig || defaultOptions.httpConfig;
                RailsResource.config.httpConfig.headers = angular.extend({'Accept': 'application/json', 'Content-Type': 'application/json'}, RailsResource.config.httpConfig.headers || {});
                RailsResource.config.defaultParams = config.defaultParams || defaultOptions.defaultParams;
                RailsResource.config.updateMethod = (config.updateMethod || defaultOptions.updateMethod).toLowerCase();
                RailsResource.config.resourceConstructor = config.resourceConstructor || RailsResource;

                RailsResource.config.requestTransformers = config.requestTransformers || [];
                RailsResource.config.responseInterceptors = config.responseInterceptors || [];
                RailsResource.config.afterResponseInterceptors = config.afterResponseInterceptors || [];
                RailsResource.config.serializer = RailsResourceInjector.createService(config.serializer || railsSerializer());
                RailsResource.config.name = RailsResource.config.serializer.underscore(config.name);
                RailsResource.config.pluralName = RailsResource.config.serializer.underscore(config.pluralName || RailsResource.config.serializer.pluralize(RailsResource.config.name));

                RailsResource.setUrl = function(url) {
                    RailsResource.config.url = url;
                };

                RailsResource.buildUrl = function (context) {
                    if (!RailsResource.config.urlBuilder || RailsResource.config.url !== previousUrl) {
                        RailsResource.config.urlBuilder = railsUrlBuilder(RailsResource.config.url);
                        previousUrl = RailsResource.config.url;
                    }

                    return RailsResource.config.urlBuilder(context);
                };

                /**
                 * Add a callback to run on response and construction.
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.beforeResponse = function(fn) {
                    fn = RailsResourceInjector.getDependency(fn);
                    RailsResource.config.responseInterceptors.push(function(promise) {
                        return promise.then(function(response) {
                            fn(response.data, promise.resource.config.resourceConstructor, promise.context);
                            return response;
                        });
                    });
                };

                /**
                 * Add a callback to run after response has been processed.  These callbacks are not called on object construction.
                 * @param fn(response data, constructor) - response data is either the resource instance returned or an array of resource instances and constructor is the resource class calling the function
                 */
                RailsResource.afterResponse = function(fn) {
                    fn = RailsResourceInjector.getDependency(fn);
                    RailsResource.config.afterResponseInterceptors.push(function(promise) {
                        return promise.then(function(response) {
                            fn(response, promise.resource.config.resourceConstructor);
                            return response;
                        });
                    });
                };

                /**
                 * Adds a function to run after serializing the data to send to the server, but before root-wrapping it.
                 * @param fn (data, constructor) - data object is the serialized resource instance, and constructor the resource class calling the function
                 */
                RailsResource.beforeRequest = function(fn) {
                    fn = RailsResourceInjector.getDependency(fn);
                    RailsResource.config.requestTransformers.push(function(data, resource) {
                        return fn(data, resource.config.resourceConstructor) || data;
                    });
                };

                // transform data for request:
                RailsResource.transformData = function (data) {
                    var transformer;
                    data = RailsResource.config.serializer.serialize(data);

                    forEachDependency(RailsResource.config.requestTransformers, function (transformer) {
                        data = transformer(data, RailsResource);
                    });

                    if (RailsResource.config.rootWrapping) {
                        data = railsRootWrappingTransformer(data, RailsResource);
                    }

                    return data;
                };

                // transform data on response:
                RailsResource.callInterceptors = function (promise, context) {
                    promise = promise.then(function (response) {
                        // store off the data in case something (like our root unwrapping) assigns data as a new object
                        response.originalData = response.data;
                        return response;
                    });

                    if (RailsResource.config.rootWrapping) {
                        promise.resource = RailsResource;
                        promise = railsRootWrappingInterceptor(promise);
                    }

                    promise.then(function (response) {
                        response.data = RailsResource.config.serializer.deserialize(response.data, RailsResource);
                        return response;
                    });

                    // data is now deserialized. call response interceptors including beforeResponse
                    forEachDependency(RailsResource.config.responseInterceptors, function (interceptor) {
                        promise.resource = RailsResource;
                        promise.context = context;
                        promise = interceptor(promise);
                    });

                    return promise;
                };

                // transform data after response has been converted to a resource instance:
                RailsResource.callAfterInterceptors = function (promise) {
                    // data is now deserialized. call response interceptors including afterResponse
                    forEachDependency(RailsResource.config.afterResponseInterceptors, function (interceptor) {
                        promise.resource = RailsResource;
                        promise = interceptor(promise);
                    });

                    return promise;
                };

                RailsResource.processResponse = function (promise) {
                    promise = RailsResource.callInterceptors(promise).then(function (response) {
                        return response.data;
                    });

                    return RailsResource.callAfterInterceptors(promise);
                };

                RailsResource.getParameters = function (queryParams) {
                    var params;

                    if (RailsResource.config.defaultParams) {
                        params = RailsResource.config.defaultParams;
                    }

                    if (angular.isObject(queryParams)) {
                        params = angular.extend(params || {}, queryParams);
                    }

                    return params;
                };

                RailsResource.getHttpConfig = function (queryParams) {
                    var params = RailsResource.getParameters(queryParams);

                    if (params) {
                        return angular.extend({params: params}, RailsResource.config.httpConfig);
                    }

                    return angular.copy(RailsResource.config.httpConfig);
                };

                /**
                 * Returns a URL from the given parameters.  You can override this method on your resource definitions to provide
                 * custom logic for building your URLs or you can utilize the parameterized url strings to substitute values in the
                 * URL string.
                 *
                 * The parameters in the URL string follow the normal Angular binding expression using {{ and }} for the start/end symbols.
                 *
                 * If the context is a number and the URL string does not contain an id parameter then the number is appended
                 * to the URL string.
                 *
                 * If the context is a number and the URL string does
                 * @param context
                 * @param path {string} (optional) An additional path to append to the URL
                 * @return {string}
                 */
                RailsResource.$url = RailsResource.resourceUrl = function (context, path) {
                    if (!angular.isObject(context)) {
                        context = {id: context};
                    }

                    return appendPath(RailsResource.buildUrl(context || {}), path);
                };

                RailsResource.$get = function (url, queryParams) {
                    return RailsResource.processResponse($http.get(url, RailsResource.getHttpConfig(queryParams)));
                };

                RailsResource.query = function (queryParams, context) {
                    return RailsResource.$get(RailsResource.resourceUrl(context), queryParams);
                };

                RailsResource.get = function (context, queryParams) {
                    return RailsResource.$get(RailsResource.resourceUrl(context), queryParams);
                };

                /**
                 * Returns the URL for this resource.
                 *
                 * @param path {string} (optional) An additional path to append to the URL
                 * @returns {string} The URL for the resource
                 */
                RailsResource.prototype.$url = function(path) {
                    return appendPath(RailsResource.resourceUrl(this), path);
                };

                RailsResource.prototype.processResponse = function (promise) {
                    promise = RailsResource.callInterceptors(promise, this);

                    promise = promise.then(angular.bind(this, function (response) {
                        // we may not have response data
                        if (response.hasOwnProperty('data') && angular.isObject(response.data)) {
                            angular.extend(this, response.data);
                        }

                        return this;
                    }));

                    return RailsResource.callAfterInterceptors(promise);
                };

                angular.forEach(['post', 'put', 'patch'], function (method) {
                    RailsResource['$' + method] = function (url, data) {
                        var config;
                        // clone so we can manipulate w/o modifying the actual instance
                        data = RailsResource.transformData(angular.copy(data, {}));
                        config = angular.extend({method: method, url: url, data: data}, RailsResource.getHttpConfig());
                        return RailsResource.processResponse($http(config));
                    };

                    RailsResource.prototype['$' + method] = function (url) {
                        var data, config;
                        // clone so we can manipulate w/o modifying the actual instance
                        data = RailsResource.transformData(angular.copy(this, {}));
                        config = angular.extend({method: method, url: url, data: data}, RailsResource.getHttpConfig());
                        return this.processResponse($http(config));

                    };
                });

                RailsResource.prototype.create = function () {
                    return this.$post(this.$url(), this);
                };

                RailsResource.prototype.update = function () {
                    return this['$' + RailsResource.config.updateMethod](this.$url(), this);
                };

                RailsResource.prototype.isNew = function () {
                    return this.id == null;
                }

                RailsResource.prototype.save = function () {
                    if (this.isNew()) {
                        return this.create();
                    } else {
                        return this.update();
                    }
                }

                RailsResource['$delete'] = function (url) {
                    return RailsResource.processResponse($http['delete'](url, RailsResource.getHttpConfig()));
                };

                RailsResource.prototype['$delete'] = function (url) {
                    return this.processResponse($http['delete'](url, RailsResource.getHttpConfig()));
                };

                //using ['delete'] instead of .delete for IE7/8 compatibility
                RailsResource.prototype.remove = RailsResource.prototype['delete'] = function () {
                    return this.$delete(this.$url());
                };

                return RailsResource;
            }

            return railsResourceFactory;
        }];
     });
}());
