'use strict';

angular.module('mms')
.factory('VizService', ['$q', '$http', 'URLService', VizService]);

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
function VizService($q, $http, URLService) {

    var urls = {}; //map of id to map of version to url

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
        var update = !updateFromServer ? false : updateFromServer;
        var ws = !workspace ? 'master' : workspace;
        var ver = !version ? 'latest' : version;

        var deferred = $q.defer();
        if (urls.hasOwnProperty(id)) {
            if (urls[id].hasOwnProperty(ver)) {
                if (version !== 'latest' || !update) {
                    deferred.resolve(urls[id][ver]);
                    return deferred.promise;
                }
            } 
        } else {
            urls[id] = {};
        }
        var options = {params:{}};
        if (URLService.isTimestamp(version))
            options.params.timestamp = version;
        $http.get(URLService.getImageURL(id, ws, ver), options)
        .success(function(data, status, headers, config) {
            if (data.artifacts.length > 0) {
                urls[id][ver] = '/alfresco' + data.artifacts[0].url;
                deferred.resolve(urls[id][ver]);
            } else {
                deferred.reject({status: 200, data: data, message: 'Not Found'});
            }
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    return {
        getImageURL: getImageURL,
    };

}