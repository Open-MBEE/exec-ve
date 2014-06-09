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
    var versions = {};
    var inProgress = {};

    var isTimestamp = function(version) {
        if (String(version).indexOf('-') >= 0)
            return true;
        return false;
        //return isNaN(version); //this may be unreliable
    };

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
    var getElement = function(id, workspace, version) {
        var ws = !workspace ? 'master' : workspace;
        var key = 'getElement(' + id + ws + version + ')';
        if (inProgress.hasOwnProperty(key))
            return inProgress[key];
        var deferred = $q.defer();
        if (elements.hasOwnProperty(id)) {
            if (elements[id].hasOwnProperty(version)) {
                deferred.resolve(elements[id][version]);
                return deferred.promise;
            } 
        } else {
            elements[id] = {};
        }
        var url = URLService.getElementURL(id, ws);
        if (isTimestamp(version)) {
            url += '?timestamp=' + version;
        } else {
            url += '/versions/' + version;
        }
        inProgress[key] = deferred.promise;
        $http.get(url)
        .success(function(data, status, headers, config) {
            if (data.elements.length > 0) {
                elements[id][version] = data.elements[0];
                deferred.resolve(elements[id][version]);
            } else {
                deferred.reject({status: 200, data: data, message: 'Not Found'});
            }
            delete inProgress[key];
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[key];
        });
        return deferred.promise;
    };

    var getElements = function(ids, workspace, version) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElement(id, workspace, version));
        });
        return $q.all(promises);
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
    var getElementVersions = function(id, updateFromServer, workspace) {
        var ws = !workspace ? 'master' : workspace;
        var update = !updateFromServer ? false : updateFromServer;

        var deferred = $q.defer();
        if (versions.hasOwnProperty(id) && !update) {
            deferred.resolve(versions[id]);
            return deferred.promise;
        }
        $http.get(URLService.getElementVersionsURL(id, workspace))
        .success(function(data, statas, headers, config){
            versions[id] = data.versions;
            deferred.resolve(versions[id]);
        }).error(function(data, status, headers, config){
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var getGenericElements = function(url, key, workspace, version) {
        var ws = !workspace ? 'master' : workspace;
        var progress = 'getGenericElements(' + url + key + ws + version + ')';
        if (inProgress.hasOwnProperty(progress))
            return inProgress[progress];

        var deferred = $q.defer();
        inProgress[progress] = deferred.promise;
        $http.get(url)
        .success(function(data, status, headers, config) {
            var result = [];
            data[key].forEach(function(element) {
                if (elements.hasOwnProperty(element.sysmlid)) {
                    if (elements[element.sysmlid].hasOwnProperty(version)) {
                        result.push(elements[element.sysmlid][version]);
                    } else {
                        elements[element.sysmlid][version] = element;
                        result.push(element);
                    }
                } else {
                    elements[element.sysmlid] = {};
                    elements[element.sysmlid][version] = element;
                    result.push(element);
                }
            });
            deferred.resolve(result);
            delete inProgress[progress];
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[progress];
        });
        return deferred.promise;
    };

    return {
        getElement: getElement,
        getElements: getElements,
        getElementVersions: getElementVersions,
        getGenericElements: getGenericElements
    };
    
}