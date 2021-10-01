'use strict';

angular.module('mms')
.factory('ArtifactService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', 'HttpService', 'ElementService', ArtifactService]);

/**
 * @ngdoc service
 * @name mms.ArtifactService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.UtilsService
 * @requires mms.CacheService
 * @requires mms.HttpService
 * 
 * @description
 * A service to add, get, bulk get and update/create artifacts, with caching
 */
function ArtifactService($q, $http, URLService, UtilsService, CacheService, HttpService, ElementService) {

    var inProgress = {};

    var hasArtifact = function(ext) {
        return function(artifact) {
            return artifact.extension === ext;
        };
    };

    /**
     * @ngdoc method
     * @name mms.ArtifactService#getArtifacts
     * @methodOf mms.ArtifactService
     *
     * @description
     * Same as getArtifact, but for multiple extensions.
     *
     * @returns {string} Will return a string at which url the Artifact can be retrieved
     * @param elementData {object}
     * @param commitId {string}
     * @param extensions {Array.<string>}
     */
    var getArtifacts = function(elementData, commitId, extensions) {
        var art = {};
        var artifacts = elementData._artifacts;
        if (artifacts !== undefined) {
            var artifactOb = {
                elementId: elementData.id,
                projectId: elementData._projectId,
                refId: elementData._refId,
                commitId: (commitId === undefined) ? 'latest' : commitId
            };
            if (extensions === undefined) {
                extensions = artifacts.map(a => a.extension);
            }
            for (var i = 0; i < extensions.length; i++) {
                const ext = extensions[i];
                if (artifacts.filter(hasArtifact(ext)).length > 0) {
                    art[ext] = URLService.getArtifactURL(artifactOb, ext);
                }
            }
        }
        return art;
    };

    var getContentTypes = function(elementData, extensions) {
        var art = {};
        var artifacts = elementData._artifacts;
        if (artifacts !== undefined) {
            if (extensions === undefined) {
                extensions = artifacts.map(a => a.extension);
            }
            for (var i = 0; i < extensions.length; i++) {
                const ext = extensions[i];
                if (artifacts.filter(hasArtifact(ext)).length > 0) {
                    art[ext] = artifacts[i].mimetype;
                }
            }
        }
        return art;
    };




    /**
     * @ngdoc method
     * @name mms.ArtifactService#cacheArtifact
     * @methodOf mms.ArtifactService
     * 
     * @description
     * handles caching of artifact objects - in case the metadata of reqOb is different
     * from the artifact's canonical projectId/refId/commitId (due to being requested
     * from a different project context), it'll become an alias
     * 
     * @param {object} reqOb request keys - {projectId, refId, artifactId, commitId, extended}
     * @param {object} artifactOb object to cache
     * @param {boolean} [edit=false] whether object to cache is for editing
     * @returns {object} cached object
     */
    var cacheArtifact = function(reqOb, artifactOb, edit) {
        var requestCacheKey = getArtifactCacheKey(reqOb, artifactOb.id);
        var origResultCommit = artifactOb._commitId;
        if (reqOb.commmitId === 'latest') {
            var resultCommitCopy = JSON.parse(JSON.stringify(artifactOb));
            artifactOb._commitId = 'latest'; //so realCacheKey is right later
            var commitCacheKey = UtilsService.makeArtifactKey(resultCommitCopy); //save historic artifact
            if (!edit) {
                CacheService.put(commitCacheKey, resultCommitCopy, true);
            }
        }
        var realCacheKey = UtilsService.makeArtifactKey(artifactOb, edit);
        artifactOb._commitId = origResultCommit; //restore actual commitId
        if (angular.equals(realCacheKey, requestCacheKey)) {
            artifactOb = CacheService.put(requestCacheKey, artifactOb, true);
        } else {
            CacheService.put(requestCacheKey, realCacheKey.join('|'));
            artifactOb = CacheService.put(realCacheKey, artifactOb, true);
        }
        return artifactOb;
    };

    /**
     * @ngdoc method
     * @name mms.ArtifactService#getArtifact
     * @methodOf mms.ArtifactService
     *
     * @description
     * Gets an artifact url by extension. It will return the proper URL whether the object already has that artifact or
     * not.
     *
     * @returns {String} Returns a string with the URL to retrieve the artifact.
     * @param elementData {Object} An object containing the data for an Element that has artifacts attached to it.
     * @param commitId {String} A string which optionally includes
     * @param extension {String} A string which optionally includes the desired extension for the artifact. If left
     * undefined this function will return the URL for the numerically first Artifact.
     */
    var getArtifact = function(elementData, commitId, extension) {
        var artifacts = elementData._artifacts;
        var artifactOb = {
            elementId: elementData.id,
            projectId: elementData._projectId,
            refId: elementData._refId,
            commitId: (commitId === undefined) ? 'latest' : commitId
        };
        if (extension === undefined && artifacts !== undefined) {
            return URLService.getArtifactURL(artifactOb, artifacts[0].extension);
        }

        return URLService.getArtifactURL(artifactOb, extension);
    };



    /**
     * @ngdoc method
     * @name mms.ArtifactService#getArtifactHistory
     * @methodOf mms.ArtifactService
     * 
     * @description
     * Queries for an artifact's entire version history
     *
     * @param {object} reqOb see getArtifact
     * @param {integer} [weight=1] priority
     * @param {boolean} [update=false] update from server
     * @returns {Promise} The promise will be resolved with an array of commit objects.
     */
    var getArtifactHistory = function(reqOb, weight, update) {
        UtilsService.normalize(reqOb);
        var key = URLService.getArtifactHistoryURL(reqOb);
        if (inProgress.hasOwnProperty(key)) {
            return inProgress[key];
        }
        var requestCacheKey = ['artifactHistory', reqOb.projectId, reqOb.refId, reqOb.artifactId];
        var deferred = $q.defer();
        if (CacheService.exists(requestCacheKey) && !update) {
            deferred.resolve(CacheService.get(requestCacheKey));
            return deferred.promise;
        }
        inProgress[key] = deferred.promise;
        $http.get(URLService.getArtifactHistoryURL(reqOb))
        .then(function(response) {
            deferred.resolve(CacheService.put(requestCacheKey, response.data.commits, true));
            delete inProgress[key];
        }, function(response) {
            URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            delete inProgress[key];
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ArtifactService#updateArtifact
     * @methodOf mms.ArtifactService
     * 
     * @description
     * Save artifact to mms and update the cache if successful, the artifact object
     * must have an id, and whatever property that needs to be updated.
     * 
     * {@link mms.ArtifactService#methods_getElementForEdit see also getElementForEdit}
     *
     * @param {object} artifactOb An object that contains _projectId, _refId, sysmlId and any property changes to be saved.
     * @returns {Promise} The promise will be resolved with the updated cache element reference if 
     *      update is successful. If a conflict occurs, the promise will be rejected with status of 409
     */
    // var updateArtifact = function(artifactOb, returnChildViews) { //artifactOb should have the keys needed to make url
    //     var deferred = $q.defer();
    //     return deferred.promise;
    // };

    /**
     * @ngdoc method
     * @name mms.ArtifactService#createArtifact
     * @methodOf mms.ArtifactService
     * 
     * @description
     * Create artifact on mms.
     * 
     * @param {object} reqOb see description of getArtifact, instead of artifactId,
     *                       'artifact' key should be the artifact object to create
     * @returns {Promise} The promise will be resolved with the created artifact
     *                    references if create is successful.
     */
    // var createArtifact = function(reqOb) {
    //     return deferred.promise;
    // };

    var getArtifactCacheKey = function(reqOb, id, edit) {
        var refId = !reqOb.refId ? 'master' : reqOb.refId;
        var commitId = !reqOb.commitId ? 'latest' : reqOb.commitId;
        var artifactId = id ? id : reqOb.artifactId;
        var key = ['artifact', reqOb.projectId, refId, artifactId, commitId];
        if (edit) {
            key.push('edit');
        }
        return key;
    };

    var reset = function() {
        inProgress = {};
    };


    return {
        hasArtifact: hasArtifact,
        cacheArtifact: cacheArtifact,
        getArtifact: getArtifact,
        getArtifacts: getArtifacts,
        getArtifactHistory: getArtifactHistory,
        // createArtifact: createArtifact,
        // updateArtifact: updateArtifact,
        reset: reset
    };
}