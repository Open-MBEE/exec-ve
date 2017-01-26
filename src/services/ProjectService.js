'use strict';

angular.module('mms')
.factory('ProjectService', ['$q', '$http', 'URLService', 'CacheService', ProjectService]);

/**
 * @ngdoc service
 * @name mms.ProjectService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.CacheService
 * 
 * @description
 * This is a utility service for getting project, ref, commit information
 */
function ProjectService($q, $http, URLService, CacheService) {
    var inProgress = {};

    /**
     * @ngdoc method
     * @name mms.ProjectService#getOrg
     * @methodOf mms.ProjectService
     * 
     * @description
     * Gets org information from mms
     *
     * @param {string} orgId id of org
     * @returns {Promise} Resolves to the org object.
     */
    var getOrg = function(orgId) {
        var deferred = $q.defer();
        getOrgs().then(function(data) {
            var result = CacheService.get(['org', orgId]);
            if (result)
                deferred.resolve(result);
            else
                deferred.reject({status: 404, data: '', message: "Org not found"});
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ProjectService#getOrgs
     * @methodOf mms.ProjectService
     * 
     * @description
     * Gets orgs information
     *
     * @returns {Promise} Resolves into array of org objects.
     */
    var getOrgs = function() {
        var key = 'orgs';
        if (inProgress.hasOwnProperty(key))
            return inProgress[key];
        var deferred = $q.defer();
        if (CacheService.exists(key)) {
            deferred.resolve(CacheService.get(key));
        } else {
            inProgress[key] = deferred.promise;
            $http.get(URLService.getOrgsURL())
            .then(function(response) {
                CacheService.put(key, response.data.orgs, false);
                for (var org in response.data.orgs) {
                    CacheService.put(['org', org.id], org);
                }
                deferred.resolve(CacheService.get(key));
            }, function(response) {
                URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(function() {
                delete inProgress[key];
            });
        }
        return deferred.promise;
    };

    var getProjects = function(orgId) {
        var deferred = $q.defer();
        var url = URLService.getProjectsURL(orgId);
        if (inProgress.hasOwnProperty(url))
            return inProgress[url];
        var cacheKey = orgId ? 'projects' : ['projects', orgId];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress[url] = deferred.promise;
            $http.get(url).then(function(response) {
                if (!angular.isArray(response.data.projects)) {
                    deferred.reject({}); //TODO add error message
                    return;
                }
                var projects = [];
                for (var project in response.data.projects) {
                    CacheService.put(['project', project.id], project, true);
                    projects.push(CacheService.get(['project', project.id]));
                }
                CacheService.put(cacheKey, projects, false);
                deferred.resolve(CacheService.get(cacheKey));
            }, function(response) {
                URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(function() {
                delete inProgress[url];
            });
        }
        return deferred.promise;
    };

    var getProject = function(projectId) {
        var deferred = $q.defer();
        var url = URLService.getProjectURL(projectId);
        if (inProgress.hasOwnProperty(url))
            return inProgress[url];
        var cacheKey = ['project', projectId];
        if (CacheService.exists(cacheKey))
            deferred.resolve(CacheService.get(cacheKey));
        else {
            inProgress[url] = deferred.promise;
            $http.get(url).then(function(response) {
                if (!angular.isArray(response.data.projects) || response.data.projects.length === 0) {
                    deferred.reject({}); //TODO add error message
                    return;
                }
                CacheService.put(cacheKey, response.data.projects[0], true);
                deferred.resolve(CacheService.get(cacheKey));
            }, function(response) {
                URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(function() {
                delete inProgress[url];
            });
        }
    };

    var getRefs = function(projectId) {
        var cacheKey = ['refs', projectId];
        var url = URLService.getRefsURL(projectId);
        if (inProgress.hasOwnProperty(url))
            return inProgress[url];
        var deferred = $q.defer();
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress[url] = deferred.promise;
            $http.get(url).then(function(response) {
                if (!angular.isArray(response.data.refs)) {
                    deferred.reject({}); //TODO add error message
                    return;
                }
                var refs = [];
                for (var ref in response.data.refs) {
                    CacheService.put(['ref', projectId, ref.id], ref, true);
                    refs.push(CacheService.get(['ref', projectId, ref.id]));
                }
                CacheService.put(cacheKey, refs, false);
                deferred.resolve(CacheService.get(cacheKey));
            }, function(response) {
                URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(function() {
                delete inProgress[url];
            });
        }
        return deferred.promise;
    };

    var getRef = function(refId, projectId) {
        var deferred = $q.defer();
        getRefs(projectId).then(function(data) {
            var result = CacheService.get(['ref', projectId, refId]);
            if (result)
                deferred.resolve(result);
            else
                deferred.reject({status: 404, data: '', message: "Ref not found"});
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    var createRef = function(refOb, projectId) {

    };

    var updateRef = function(refOb, projectId) {

    };

    var deleteRef = function(refId, projectId) {

    };

    var reset = function() {
        inProgress = {};
    };
    
    return {
        getProjects: getProjects,
        getProject: getProject,
        getOrgs: getOrgs,
        getOrg: getOrg,
        getRefs: getRefs,
        getRef: getRef,
        createRef: createRef,
        updateRef: updateRef,
        deleteRef: deleteRef,
        reset: reset,
    };
}