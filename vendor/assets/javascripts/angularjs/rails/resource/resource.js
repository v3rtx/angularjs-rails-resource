(function (undefined) {
    angular.module('rails').factory('railsRootWrappingTransformer', function () {
        return function (data, resource) {
            var result = {};
            result[angular.isArray(data) ? resource.rootPluralName : resource.rootName] = data;
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
                if (response.data && response.data.hasOwnProperty(resource.rootName)) {
                    response.data = response.data[resource.rootName];
                } else if (response.data && response.data.hasOwnProperty(resource.rootPluralName)) {
                    response.data = response.data[resource.rootPluralName];
                }

                return response;
            });
        };
    });

    angular.module('rails').provider('railsResourceFactory', function () {
        var defaultOptions = {
            enableRootWrapping: true,
            updateMethod: 'put',
            httpConfig: {},
            defaultParams: undefined
        };

        this.enableRootWrapping = function (value) {
            defaultOptions.enableRootWrapping = value;
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
                var transformers = config.requestTransformers,
                    interceptors = config.responseInterceptors,
                    afterInterceptors = config.afterResponseInterceptors;

                function appendPath(url, path) {
                    if (path) {
                        if (path[0] !== '/') {
                            url += '/';
                        }

                        url += path;
                    }

                    return url;
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

                RailsResource.setUrl = function(url) {
                    RailsResource.url = railsUrlBuilder(url);
                };
                RailsResource.setUrl(config.url);

                RailsResource.enableRootWrapping = config.wrapData === undefined ? defaultOptions.enableRootWrapping : config.wrapData; // using undefined check because config.wrapData || true would be true when config.wrapData === false
                RailsResource.httpConfig = config.httpConfig || defaultOptions.httpConfig;
                RailsResource.httpConfig.headers = angular.extend({'Accept': 'application/json', 'Content-Type': 'application/json'}, RailsResource.httpConfig.headers || {});
                RailsResource.defaultParams = config.defaultParams || defaultOptions.defaultParams;
                RailsResource.updateMethod = (config.updateMethod || defaultOptions.updateMethod).toLowerCase();

                RailsResource.requestTransformers = [];
                RailsResource.responseInterceptors = [];
                RailsResource.afterResponseInterceptors = [];
                RailsResource.serializer = RailsResourceInjector.createService(config.serializer || railsSerializer());
                RailsResource.rootName = RailsResource.serializer.underscore(config.name);
                RailsResource.rootPluralName = RailsResource.serializer.underscore(config.pluralName || RailsResource.serializer.pluralize(config.name));

                /**
                 * Add a callback to run on response and construction.
                 * @param fn(response data, constructor, context) - response data is either the resource instance returned or an array of resource instances,
                 *      constructor is the resource class calling the function,
                 *      context is the resource instance of the calling method (create, update, delete) or undefined if the method was a class method (get, query)
                 */
                RailsResource.beforeResponse = function(fn) {
                    fn = RailsResourceInjector.getDependency(fn);
                    RailsResource.responseInterceptors.push(function(promise) {
                        return promise.then(function(response) {
                            fn(response.data, promise.resource, promise.context);
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
                    RailsResource.afterResponseInterceptors.push(function(promise) {
                        return promise.then(function(response) {
                            fn(response, promise.resource);
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
                    RailsResource.requestTransformers.push(function(data, resource) {
                        return fn(data, resource) || data;
                    });
                };

                // copied from $HttpProvider to support interceptors being dependency names or anonymous factory functions
                angular.forEach(interceptors, function (interceptor) {
                    RailsResource.responseInterceptors.push(RailsResourceInjector.getDependency(interceptor));
                });

                angular.forEach(afterInterceptors, function (interceptor) {
                    RailsResource.afterResponseInterceptors.push(RailsResourceInjector.getDependency(interceptor));
                });

                angular.forEach(transformers, function (transformer) {
                    RailsResource.requestTransformers.push(RailsResourceInjector.getDependency(transformer));
                });

                // transform data for request:
                RailsResource.transformData = function (data) {
                    data = RailsResource.serializer.serialize(data);

                    // data is now serialized. call request transformers including beforeRequest
                    angular.forEach(RailsResource.requestTransformers, function (transformer) {
                        data = transformer(data, RailsResource);
                    });


                    if (RailsResource.enableRootWrapping) {
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

                    if (RailsResource.enableRootWrapping) {
                        promise.resource = RailsResource;
                        promise = railsRootWrappingInterceptor(promise);
                    }

                    promise.then(function (response) {
                        response.data = RailsResource.serializer.deserialize(response.data, RailsResource);
                        return response;
                    });

                    // data is now deserialized. call response interceptors including beforeResponse
                    angular.forEach(RailsResource.responseInterceptors, function (interceptor) {
                        promise.resource = RailsResource;
                        promise.context = context;
                        promise = interceptor(promise);
                    });

                    return promise;
                };

                // transform data after response has been converted to a resource instance:
                RailsResource.callAfterInterceptors = function (promise) {
                    // data is now deserialized. call response interceptors including afterResponse
                    angular.forEach(RailsResource.afterResponseInterceptors, function (interceptor) {
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

                    if (RailsResource.defaultParams) {
                        params = RailsResource.defaultParams;
                    }

                    if (angular.isObject(queryParams)) {
                        params = angular.extend(params || {}, queryParams);
                    }

                    return params;
                };

                RailsResource.getHttpConfig = function (queryParams) {
                    var params = RailsResource.getParameters(queryParams);

                    if (params) {
                        return angular.extend({params: params}, RailsResource.httpConfig);
                    }

                    return angular.copy(RailsResource.httpConfig);
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

                    return appendPath(RailsResource.url(context || {}), path);
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
                    return this['$' + RailsResource.updateMethod](this.$url(), this);
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
