(function (undefined) {
    angular.module('rails').factory('RailsInflector', function() {
        function camelize(key) {
            if (!angular.isString(key)) {
                return key;
            }

            // should this match more than word and digit characters?
            return key.replace(/_[\w\d]/g, function (match, index, string) {
                return index === 0 ? match : string.charAt(index + 1).toUpperCase();
            });
        }

        function underscore(key) {
            if (!angular.isString(key)) {
                return key;
            }

            return key.replace(/[A-Z]/g, function (match, index) {
                return index === 0 ? match : '_' + match.toLowerCase();
            });
        }

        return {
            camelize: camelize,
            underscore: underscore
        }
    });
}());