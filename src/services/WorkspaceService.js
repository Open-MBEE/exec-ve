'use strict';

angular.module('mms')
.factory('WorkspaceService', ['$http', '$q', 'URLService', 'ElementService', 'CacheService', WorkspaceService]);

/**
 * @ngdoc service
 * @name mms.WorkspaceService
 * @requires $http
 * @requires $q
 * 
 * @description
 */
function WorkspaceService($http, $q, URLService, ElementService, CacheService) {

    var getAll = function() {

    };

    var get = function(ws) {

    };

    var diff = function(ws1, ws2, ws1time, ws2time) {

    };

    var merge = function(changes, targetWs) {

    };

    var remove = function(ws) {

    };

    var create = function(name, parentWs) {

    };
    

    return {
        getAll: getAll,
        get: get,
        diff: diff,
        merge: merge,
        remove: remove,
        create: create
    };

}