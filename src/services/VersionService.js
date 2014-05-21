'use strict';

angular.module('mms')
.factory('VersionService', ['$q', '$http', 'URLService', VersionService]);

/**
 * @ngdoc service
 * @name mms.VersionService
 * @requires $q
 * @requires $http
 * @requires $mms.URLService
 * 
 * @description
 * This service is for querying version or history information for things in alfresco
 */
function VersionService($q, $http, URLService) {

    var elements = {};

    /**
     * @ngdoc method
     * @name mms.VersionService#getElementVersionByTag
     * @methodOf mms.VersionService
     * 
     * @description
     * Queries for an element version as of a certain time.
     *
     * @param {string} id The id of the element
     * @param {Date} date A js date object
     * @returns {Promise} The promise will be resolved with an element object.
     */
    var getElementByVersion = function(id, workspace, version) {
        var deferred = $q.defer();
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.VersionService#getElementVersionByDate
     * @methodOf mms.VersionService
     * 
     * @description
     * Queries for an element version as of a certain time.
     *
     * @param {string} id The id of the element
     * @param {Date} date A js date object
     * @returns {Promise} The promise will be resolved with an element object.
     */
    var getElementByTimestamp = function(id, workspace, timestamp) {
        var deferred = $q.defer();
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.VersionService#getElementVersions
     * @methodOf mms.VersionService
     * 
     * @description
     * Queries for an element's entire version history
     *
     * @param {string} id The id of the element
     * @returns {Promise} The promise will be resolved with an array of element objects.
     */
    var getElementVersions = function(id, workspace) {
        var deferred = $q.defer();
        return deferred.promise;
    };

    var getElements = function(url, key, workspace, version) {
        var deferred = $q.defer();
        return deferred.promise;
    };

    return {
        getElementByVersion: getElementByVersion,
        getElementByTimestamp: getElementByTimestamp,
        getElementVersions: getElementVersions,
        getElements: getElements
    };
    
}