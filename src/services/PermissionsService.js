'use strict';

angular.module('mms')
.factory('PermissionsService', ['$q', '$http', 'URLService', 'CacheService', '_', PermissionsService]);


/**
 * @ngdoc service
 * @name mms.PermissionsService
 *
 * @description
 * This utility service handles permissions inquiries
 */
function PermissionsService($q, $http, URLService, CacheService, _) {

    var inProgress = {};

    var hasProjectEditPermission = function(projectOb) {
        var requestCacheKey = ['project_permission', projectOb.id];
        var key = projectOb.id;
        return permissionsLookup(requestCacheKey, key, 
        {
            "type" : "PROJECT",
            "projectId": projectOb.id,
            "privilege": "PROJECT_EDIT"
        });
    };

    var hasBranchEditPermission = function(refOb) {
        var requestCacheKey = ['branch_permission', refOb._projectId, refOb.id];
        var key = refOb._projectId + "||" + refOb.id;
        return permissionsLookup(requestCacheKey, key, 
        {
            "type" : "BRANCH",
            "projectId": refOb.projectId,
            "refId": refOb.id,
            "privilege": "BRANCH_EDIT_CONTENT"
        });
    };

    var hasProjectIdBranchIdEditPermission = function(projectId, refId) {
        var requestCacheKey = ['branch_permission', projectId, refId];
        var key = projectId + "||" + refId;
        return permissionsLookup(requestCacheKey, key, 
        {
            "type" : "BRANCH",
            "projectId": projectId,
            "refId": refId,
            "privilege": "BRANCH_EDIT_CONTENT"
        });
    };

    var permissionsLookup = function(cacheKey, progressKey, lookup) {
        
        var url = URLService.getPermissionsLookupURL();
        
        if (inProgress.hasOwnProperty(progressKey)) { //change to change proirity if it's already in the queue            
            return inProgress[progressKey];
        }

        var deferred = $q.defer();
        var cached = CacheService.get(cacheKey);
        if (cached) {
            deferred.resolve(cached);
            return deferred.promise;
        }
        
        inProgress[progressKey] = deferred.promise;

        $http.put(url, { "lookups" : [ lookup ] })
        .then(function(response) {
            var data = response.data.lookups;
            if (angular.isArray(data) && data.length > 0) {
                deferred.resolve(CacheService.put(cacheKey,  data[0].hasPrivilege, true));
            } else {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
            }
            delete inProgress[progressKey];
        }, function(response) {
            URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            delete inProgress[progressKey];
        });   
        
        return deferred.promise;
    };
  
    return {
        hasProjectEditPermission: hasProjectEditPermission,
        hasBranchEditPermission: hasBranchEditPermission,
        hasProjectIdBranchIdEditPermission: hasProjectIdBranchIdEditPermission
    };

}