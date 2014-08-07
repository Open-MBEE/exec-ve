'use strict';

angular.module('mms')
.factory('VizService', ['$q', '$http', 'URLService', 'CacheService', 'UtilsService', VizService]);

/**
 * @ngdoc service
 * @name mms.VizService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * 
 * @description
 * This service handles visualization needs and diagramming (TBD)
 */
function VizService($q, $http, URLService, CacheService, UtilsService) {

    /**
     * @ngdoc method
     * @name mms.VizService#getImageURL
     * @methodOf mms.VizService
     * 
     * @description
     * Gets the url for an image link based on the Magicdraw diagram id 
     * 
     * @param {string} id The id of the Magicdraw diagram.
     * @param {boolean} [updateFromServer=false] update url cache
     * @param {string} [workspace=master] the workspace
     * @param {string} [version=latest] timestamp or version
     * @returns {Promise} The promise will be resolved with the latest image url
     */
    var getImageURL = function(id, updateFromServer, workspace, version) {
        var n = normalize(id, updateFromServer, workspace, version);
        var deferred = $q.defer();
        if (CacheService.exists(n.cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(n.cacheKey));
            return deferred.promise;
        }
        $http.get(URLService.getImageURL(id, n.ws, n.ver))
        .success(function(data, status, headers, config) {
            deferred.resolve(CacheService.put(n.cacheKey, '/alfresco' + data.artifacts[0].url, false));
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var normalize = function(id, updateFromServer, workspace, version) {
        var res = UtilsService.normalize({update: updateFromServer, workspace: workspace, version: version});
        res.cacheKey = ['artifactUrl', id, res.ws, res.ver];
        return res;
    };

    return {
        getImageURL: getImageURL,
    };

}