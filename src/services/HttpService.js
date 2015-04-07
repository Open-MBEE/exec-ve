'use strict';

angular.module('mms')
.factory('HttpService', ['$http', '$q', HttpService]);

/**
 * @ngdoc service
 * @name mms.HttpService
 * 
 * @description
 * Provides prioritization and caching for $http service calls
 */
function HttpService($http, $q, _) {
    
    var cache = [];
    var inProgress = 0;

    var GET_OUTBOUND_LIMIT = 10;

    /**
     * @ngdoc method
     * @name mms.CacheService#get
     * @methodOf mms.CacheService
     * 
     * @description
     * Get value from cache
     * 
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {Object} Value if found, null if not found
     */

    var get = function(url, success, error) {        
        var deferred = $q.defer();

        if (inProgress >= GET_OUTBOUND_LIMIT) {
            // push to top of list
            var request = { url : url, success : success, error: error };
            cache.unshift(request);
        }
        else {
            inProgress++;

            $http.get(url)
                .success(success)
                .error(error)
                .finally( function() {
                    inProgress--;
                    if (cache.length > 0) {
                        var next = cache.shift();
                        deferred.resolve(get(next.url, next.success, next.error));
                    }
                });

        }

        return deferred.promise;
    };

    return {
        get: get
    };

}