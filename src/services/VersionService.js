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

    var elements = {};   //element id to dict of version key to element object
    var versions = {};   //element id to array of version objects
    var inProgress = {}; //function argument key to executing promises

    /**
     * @ngdoc method
     * @name mms.VersionService#getElement
     * @methodOf mms.VersionService
     * 
     * @description
     * Queries for an element version as of a certain time.
     *
     * @param {string} id The id of the element
     * @param {string} version A timestamp or version
     * @param {string} [workspace=master] The workspace
     * @returns {Promise} The promise will be resolved with an element object.
     */
    var getElement = function(id, version, workspace) {
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
        var url = URLService.getElementURL(id, ws, version);
        inProgress[key] = deferred.promise;
        $http.get(url, {params: {timestamp: version}})
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

    /**
     * @ngdoc method
     * @name mms.VersionService#getElements
     * @methodOf mms.VersionService
     * 
     * @description
     * Queries for element versions

     * @param {string} ids The ids of elements
     * @param {string} version A timestamp or version
     * @param {string} [workspace=master] The workspace
     * @returns {Promise} The promise will be resolved with array of element objects
     */
    var getElements = function(ids, version, workspace) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElement(id, version, workspace));
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
     * @param {boolean} [updateFromServer=false] update element version cache
     * @param {string} [workspace=master] workspace
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

    /**
     * @ngdoc method
     * @name mms.VersionService#getGenericElements
     * @methodOf mms.VersionService
     * 
     * @description
     * Gets element versions using given url
     *
     * @param {string} url The url to get
     * @param {string} key The key in return value that has element array
     * @param {string} version Timestamp or version
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} The promise will be resolved with an array of element objects.
     */
    var getGenericElements = function(url, key , version, workspace) {
        var ws = !workspace ? 'master' : workspace;
        var progress = 'getGenericElements(' + url + key + ws + version + ')';
        if (inProgress.hasOwnProperty(progress))
            return inProgress[progress];

        var deferred = $q.defer();
        inProgress[progress] = deferred.promise;
        $http.get(url, {params: {timestamp: version}})
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