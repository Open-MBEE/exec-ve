'use strict';

angular.module('mms')
.factory('WorkspaceService', ['$http', '$q', 'URLService', 'ElementService', 'CacheService', '_', WorkspaceService]);

/**
 * @ngdoc service
 * @name mms.WorkspaceService
 * @requires $http
 * @requires $q
 * 
 * @description
 * Service to get and set workspace info, create/delete workspaces
 */
function WorkspaceService($http, $q, URLService, ElementService, CacheService, _) {
    var inProgress = {};
    /**
     * @ngdoc method
     * @name mms.WorkspaceService#diff
     * @methodOf mms.WorkspaceService
     *
     * @description
     * Get workspace diff
     *
     * @param {string} ws1 target workspace
     * @param {string} ws2 source workspace
     * @param {string} ws1time timestamp of ws1
     * @param {string} ws2time timestamp of ws2
     * @returns {Promise} Promise would be resolved with diff object
     */
    var diff = function(ws1, ws2, ws1time, ws2time, recalc) {
        /*var deferred = $q.defer();
        deferred.resolve(dummy);
        return deferred.promise;*/
        
        if(recalc !== true) recalc = false;

        var w1time = !ws1time ? 'latest' : ws1time;
        var w2time = !ws2time ? 'latest' : ws2time;
        var key = 'diff' + ws1 + ws2 + w1time + w2time;
        if (inProgress.hasOwnProperty(key))
            return inProgress[key];
        var deferred = $q.defer();
        inProgress[key] = deferred.promise;
        
        $http.get(URLService.getWsDiffURL(ws1, ws2, w1time, w2time, recalc))
        .success(function(data, status, headers, config) {
            deferred.resolve(data);
            delete inProgress[key];
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[key];
        });
        
        return deferred.promise;
    };

    //TODO need to update cache for target ws
    var merge = function(changes, sourcetime) {
        var deferred = $q.defer();
        $http.post(URLService.getPostWsDiffURL(sourcetime), changes)
        .success(function(data, status, headers, config) {
            deferred.resolve(data);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };
    
    return {
        diff: diff,
        merge: merge,
    };
}