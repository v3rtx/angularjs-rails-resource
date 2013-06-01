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

    angular.module('rails').factory('railsResourceFactory', ['$http', '$q', 'railsUrlBuilder', 'railsSerializer', 'railsRootWrappingTransformer', 'railsRootWrappingInterceptor', 'RailsResourceInjector',
            function ($http, $q, railsUrlBuilder, railsSerializer, railsRootWrappingTransformer, railsRootWrappingInterceptor, RailsResourceInjector) {

        function railsResourceFactory(config) {
            var transformers = config.requestTransformers,
                interceptors = config.responseInterceptors;

            function RailsResource(value) {
                if (value) {
                    var immediatePromise = function(data) {
                      return {
                          resource: RailsResource,
                          response: data,
                          then: function(callback) {
                            this.response = callback(this.response, this.resource);
                            return immediatePromise(this.response);
                          }
                        }
                    };

                    var data = RailsResource.callInterceptors(immediatePromise({data: value})).response.data;
                    angular.extend(this, data);
                }
            }

            RailsResource.setUrl = function(url) {
              RailsResource.url = railsUrlBuilder(url);
            };
            RailsResource.setUrl(config.url);

            RailsResource.enableRootWrapping = config.wrapData === undefined ? true : config.wrapData;
            RailsResource.httpConfig = config.httpConfig || {};
            RailsResource.httpConfig.headers = angular.extend({'Accept': 'application/json', 'Content-Type': 'application/json'}, RailsResource.httpConfig.headers || {});
            RailsResource.requestTransformers = [];
            RailsResource.responseInterceptors = [];
            RailsResource.defaultParams = config.defaultParams;
            RailsResource.serializer = RailsResourceInjector.createService(config.serializer || railsSerializer());
            RailsResource.rootName = RailsResource.serializer.underscore(config.name);
            RailsResource.rootPluralName = RailsResource.serializer.underscore(config.pluralName || RailsResource.serializer.pluralize(config.name));

            // Add a function to run on response / initialize data
            // model methods and this are not yet available at this point
            RailsResource.beforeResponse = function(fn) {
              RailsResource.responseInterceptors.push(function(promise) {
                return promise.then(function(response) {
                  fn(response.data, promise.resource);
                  return response;
                });
              });
            };

            // Add a function to run on request data
            RailsResource.beforeRequest = function(fn) {
              RailsResource.requestTransformers.push(function(data, resource) {
                fn(data, resource);
                return data;
              });
            };

            // copied from $HttpProvider to support interceptors being dependency names or anonymous factory functions
            angular.forEach(interceptors, function (interceptor) {
                RailsResource.responseInterceptors.push(RailsResourceInjector.getDependency(interceptor));
            });

            angular.forEach(transformers, function (transformer) {
                RailsResource.requestTransformers.push(RailsResourceInjector.getDependency(transformer));
            });

            RailsResource.transformData = function (data) {
                angular.forEach(RailsResource.requestTransformers, function (transformer) {
                    data = transformer(data, RailsResource);
                });

                data = RailsResource.serializer.serialize(data);

                if (RailsResource.enableRootWrapping) {
                    data = railsRootWrappingTransformer(data, RailsResource);
                }

                return data;
            };

            RailsResource.callInterceptors = function (promise) {
                promise = promise.then(function (response) {
                    // store off the data in case something (like our root unwrapping) assigns data as a new object
                    response.originalData = response.data;
                    return response;
                });

                if (RailsResource.enableRootWrapping) {
                    promise.resource = RailsResource;
                    promise = railsRootWrappingInterceptor(promise);
                }

                angular.forEach(RailsResource.responseInterceptors, function (interceptor) {
                    promise.resource = RailsResource;
                    promise = interceptor(promise);
                });

                return promise.then(function (response) {
                    response.data = RailsResource.serializer.deserialize(response.data, RailsResource);
                    return response;
                });
            };

            RailsResource.processResponse = function (promise) {
                return RailsResource.callInterceptors(promise).then(function (response) {
                    return response.data;
                });
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
             * @return {string}
             */
            RailsResource.$url = RailsResource.resourceUrl = function (context) {
                if (!angular.isObject(context)) {
                    context = {id: context};
                }

                return RailsResource.url(context || {});
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

            RailsResource.prototype.$url = function() {
                return RailsResource.resourceUrl(this);
            };

            RailsResource.prototype.processResponse = function (promise) {
                promise = RailsResource.callInterceptors(promise);

                return promise.then(angular.bind(this, function (response) {
                    // we may not have response data
                    if (response.hasOwnProperty('data') && angular.isObject(response.data)) {
                        angular.extend(this, response.data);
                    }

                    return this;
                }));
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
                return this.$put(this.$url(), this);
            };

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
    }]);
}());
