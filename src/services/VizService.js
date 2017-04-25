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
     * @returns {Promise} The promise will be resolved with the latest image url
     */
    var getImageURL = function(reqOb) {
        //var n = normalize(id, update, workspace, version);
        var deferred = $q.defer();
        /*if (CacheService.exists(n.cacheKey + '|' + ext) && !n.update) {
            deferred.resolve(CacheService.get(n.cacheKey + '|' + ext));
            return deferred.promise;
        }*/
        $http.get(URLService.getImageURL(reqOb))
        .then(function(data) {
            var root = URLService.getRoot();
            var newroot = '';
            if (root.indexOf('http') > -1) {
                var parts = root.split('/');
                if (parts.length >= 3)
                    newroot = parts[0] + '/' + parts[1] + '/' + parts[2];
            }
            //var url = CacheService.put(n.cacheKey + '|' + ext, newroot + '/alfresco' + data.artifacts[0].url, false);
            var url = newroot + '/alfresco' + data.data.artifacts[0].url;
            deferred.resolve(url + '?alf_ticket=' + AuthService.getTicket());
        }, function(data) {
            URLService.handleHttpStatus(data.data, data.status, data.headers, data.config, deferred);
        });
        return deferred.promise;
    };

    var normalize = function(id, update, workspace, version) {
        var res = UtilsService.normalize({update: update, workspace: workspace, version: version});
        res.cacheKey = ['artifactUrl', id, res.ws, res.ver];
        return res;
    };

    return {
        getImageURL: getImageURL
    };

}