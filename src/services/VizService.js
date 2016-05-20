'use strict';

angular.module('mms')
.factory('VizService', ['$q', '$http', 'URLService', 'CacheService', 'UtilsService', 'AuthService', VizService]);

/**
 * @ngdoc service
 * @name mms.VizService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requries mms.CacheService
 * @requires mms.UtilsService
 * 
 * @description
 * This service handles visualization needs and diagramming (TBD)
 */
function VizService($q, $http, URLService, CacheService, UtilsService, AuthService) {

    /**
     * @ngdoc method
     * @name mms.VizService#getImageURL
     * @methodOf mms.VizService
     * 
     * @description
     * Gets the url for an image link based on the Magicdraw diagram id 
     * 
     * @param {string} id The id of the Magicdraw diagram.
     * @param {boolean} [update=false] update from server
     * @param {string} [workspace=master] the workspace
     * @param {string} [version=latest] timestamp or version
     * @returns {Promise} The promise will be resolved with the latest image url
     */
    var getImageURL = function(id, update, workspace, version) {
        var n = normalize(id, update, workspace, version);
        var deferred = $q.defer();
        if (CacheService.exists(n.cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(n.cacheKey));
            return deferred.promise;
        }
        $http.get(URLService.getImageURL(id, n.ws, n.ver))
        .success(function(data, status, headers, config) {
            var root = URLService.getRoot();
            var newroot = '';
            if (root.indexOf('http') > -1) {
                var parts = root.split('/');
                if (parts.length >= 3)
                    newroot = parts[0] + '/' + parts[1] + '/' + parts[2];
            }
            var url = CacheService.put(n.cacheKey, newroot + '/alfresco' + data.artifacts[0].url, false);
            deferred.resolve(url + '?alf_ticket=' + AuthService.getTicket());
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var normalize = function(id, update, workspace, version) {
        var res = UtilsService.normalize({update: update, workspace: workspace, version: version});
        res.cacheKey = ['artifactUrl', id, res.ws, res.ver];
        return res;
    };

    return {
        getImageURL: getImageURL,
    };

}