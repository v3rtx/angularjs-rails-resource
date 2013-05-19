(function (undefined) {
    angular.module('rails').factory('railsSerializer', ['$injector', 'RailsInflector', function ($injector, RailsInflector) {
        var defaultOptions = {
            underscore: RailsInflector.underscore,
            camelize: RailsInflector.camelize,
            exclusionMatchers: ['$']
        };

        function injectService(service) {
            if (service) {
                return angular.isString(service) ? $injector.get(service) : $injector.invoke(service)
            }

            return undefined;
        }

        function railsSerializer(options, customizer) {

            function Serializer(options, customizer) {
                if (angular.isFunction(options)) {
                    customizer = options;
                    options = {};
                }

                this.exclusions = {};
                this.serializeMappings = {};
                this.customSerializedAttributes = {};
                this.customSerializers = {};
                this.nestedResources = {};
                this.options = angular.extend({}, defaultOptions, options || {});

                if (customizer) {
                    customizer.call(this, this);
                }
            }


            Serializer.prototype.exclude = function () {
                var exclusions = this.exclusions;

                angular.forEach(arguments, function (key) {
                    exclusions[key] = true;
                });
            };

            Serializer.prototype.nestedAttribute = function () {
                var self = this;

                angular.forEach(arguments, function (key) {
                    self.rename(key, key + '_attributes');
                });
            };

            Serializer.prototype.resource = function (key, resource, serializer) {
                this.nestedResources[key] = resource;

                if (serializer) {
                    this.serializeWith(key, serializer);
                }
            };

            Serializer.prototype.rename = function (oldKey, newKey) {
                this.serializeMappings[oldKey] = newKey;
            };

            Serializer.prototype.add = function (key, value) {
                this.customSerializedAttributes[key] = value;
            };

            Serializer.prototype.serializeWith = function (key, serializer) {
                this.customSerializers[key] = serializer;
            };

            Serializer.prototype.isExcluded = function (key) {
                if (this.exclusions.hasOwnProperty(key)) {
                    return true;
                }

                if (this.options.exclusionMatchers) {
                    var excluded = false;

                    angular.forEach(this.options.exclusionMatchers, function (matcher) {
                        if (angular.isString(matcher)) {
                            excluded = excluded || key.indexOf(matcher) === 0;
                        } else if (angular.isFunction(matcher)) {
                            excluded = excluded || matcher.call(undefined, key);
                        } else if (matcher instanceof RegExp) {
                            excluded = excluded || matcher.test(key);
                        }
                    });

                    return excluded;
                }

                return false;
            };

            Serializer.prototype.getSerializedAttributeName = function (key) {
                if (this.isExcluded(key)) {
                    return undefined;
                }

                key = this.serializeMappings[key] || key;

                if (this.options.underscore) {
                    return this.options.underscore(key);
                }

                return key;
            };

            Serializer.prototype.getAttributeSerializer = function (key) {
                var resource = this.nestedResources[key],
                    serializer = this.customSerializers[key];

                // custom serializer takes precedence over resource serializer
                if (!serializer && resource) {
                    serializer = injectService(resource).serializer;
                }

                return injectService(serializer);
            };


            Serializer.prototype.serializeValue = function (data) {
                var result = data,
                    self = this;

                if (angular.isArray(data)) {
                    result = [];

                    angular.forEach(data, function (value) {
                        result.push(self.serializeValue(value));
                    });
                } else if (angular.isObject(data)) {
                    result = {};

                    angular.forEach(data, function (value, key) {
                        if (!angular.isFunction(value)) {
                            self.serializeAttribute(result, key, value);
                        }
                    });
                }

                return result;
            };

            Serializer.prototype.serializeAttribute = function (data, attribute, value) {
                var serializer = this.getAttributeSerializer(attribute),
                    serializedAttributeName = this.getSerializedAttributeName(attribute);

                // undefined means the attribute should be excluded from serialization
                if (serializedAttributeName === undefined) {
                    return;
                }

                data[serializedAttributeName] = serializer ? serializer.serialize(value) : this.serializeValue(value);
            };


            Serializer.prototype.serialize = function (data) {
                var result = this.serializeValue(data),
                    self = this;

                if (angular.isObject(result)) {
                    angular.forEach(this.customSerializedAttributes, function (value, key) {
                        if (angular.isFunction(value)) {
                            value = value.call(data, data);
                        }

                        self.serializeAttribute(result, key, value);
                    });
                }

                return result;
            };

            return new Serializer(options, customizer);

        }

        railsSerializer.defaultOptions = defaultOptions;
        return railsSerializer;
    }]);
}());