'use strict';

angular.module('mms')
.factory('ConfigService', ['$q', '$http', 'URLService', 'CacheService', 'UtilsService', 'HttpService', '_', ConfigService]);

/**
 * @ngdoc service
 * @name mms.ConfigService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.CacheService
 * @requires mms.UtilsService
 * @requires _
 * 
 * @description
 * This service manages configurations (tags) and snapshots of products. 
 * Tags are timepoints of a workspace and signifies a workspace at a particular 
 * timestamp. When a tag is created, snapshots of all products (docs) in the workspace are
 * also created.
 */

function ConfigService($q, $http, URLService, CacheService, UtilsService, HttpService, _) {
    /**
     * @ngdoc method
     * @name mms.ConfigService#convertHtmlToPdf
     * @methodOf mms.ConfigService
     *
     * @description
     * Converts HTML to PDF
     *
     * @param {Object} doc The document object with Id and HTML payload that will be converted to PDF
     * @param {string} site The site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with 'ok', the server will send an email to user when done
     */
    var convertHtmlToPdf = function(doc, site, workspace){
        var n = UtilsService.normalize(null, workspace);
        var deferred = $q.defer();
        $http.post(URLService.getHtmlToPdfURL(doc.docId, site, n.ws), {'documents': [doc]})
        .success(function(data, status, headers, config){
            deferred.resolve('ok');
        }).error(function(data, status, headers, config){
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    return {
        convertHtmlToPdf: convertHtmlToPdf,
    };
}