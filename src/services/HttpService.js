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
    
    var queue = [];
    var inProgress = 0;
    var cache = {};
    var GET_OUTBOUND_LIMIT = 8;

    /**
     * @ngdoc method
     * @name mms.HttpService#get
     * @methodOf mms.HttpService
     * 
     * @description
     * Put a new get request in the queue, the queue is LIFO
     *
     * @param {string} url url to get
     * @param {function} success success function
     * @param {function} error function
     */
    var get = function(url, success, error) {
        if (inProgress >= GET_OUTBOUND_LIMIT) {
            // push to top of list
            var request = { url : url, success : success, error: error };
            cache[url] = request;
            queue.unshift(request);
        }
        else {
            inProgress++;
            if (cache.hasOwnProperty(url)) {
                delete cache[url];
            }
            $http.get(url)
                .success(success)
                .error(error)
                .finally( function() {
                    inProgress--;
                    
                    if (queue.length > 0) {
                        var next = queue.shift();
                        get(next.url, next.success, next.error);
                    }
                });
        }
    };

    /**
     * @ngdoc method
     * @name mms.HttpService#ping
     * @methodOf mms.HttpService
     * 
     * @description
     * If the current queue has an ongoing request, put it in front
     *
     * @param {string} url url to get
     */
    var ping = function(url) {
        if (cache.hasOwnProperty(url)) {
            var request = cache[url];
            var index = queue.indexOf(request);
            if (index > -1) {
                queue.splice(index, 1);
            }
            queue.unshift(request);
        }
    };

    return {
        get: get,
        ping: ping
    };

}