'use strict';

angular.module('mms')
.factory('ProjectService', ['$q', '$http', 'URLService', 'CacheService', 'ApplicationService', ProjectService]);

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
function ProjectService($q, $http, URLService, CacheService, ApplicationService) {
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
            if (result) {
                deferred.resolve(result);
            } else {
                deferred.reject({status: 404, data: '', message: "Org not found"});
            }
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
        if (inProgress.hasOwnProperty(key)) {
            return inProgress[key];
        }
        var deferred = $q.defer();
        if (CacheService.exists(key)) {
            deferred.resolve(CacheService.get(key));
        } else {
            inProgress[key] = deferred.promise;
            $http.get(URLService.getOrgsURL())
            .then(function(response) {
                CacheService.put(key, response.data.orgs, false);
                for (var i = 0; i < response.data.orgs.length; i++) {
                    var org = response.data.orgs[i];
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
        if (inProgress.hasOwnProperty(url)) {
            return inProgress[url];
        }
        var cacheKey = !orgId ? 'projects' : ['projects', orgId];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress[url] = deferred.promise;
            $http.get(url).then(function(response) {
                if (!angular.isArray(response.data.projects)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var projects = [];
                for (var i = 0; i < response.data.projects.length; i++) {
                    var project = response.data.projects[i];
                    if (orgId) {
                        project.orgId = orgId;
                    }
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
        if (inProgress.hasOwnProperty(url)) {
            return inProgress[url];
        }
        var cacheKey = ['project', projectId];
        if (CacheService.exists(cacheKey))
            deferred.resolve(CacheService.get(cacheKey));
        else {
            inProgress[url] = deferred.promise;
            $http.get(url).then(function(response) {
                if (!angular.isArray(response.data.projects) || response.data.projects.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
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
        return deferred.promise;
    };

    var getRefs = function(projectId) {
        var cacheKey = ['refs', projectId];
        var url = URLService.getRefsURL(projectId);
        if (inProgress.hasOwnProperty(url)) {
            return inProgress[url];
        }
        var deferred = $q.defer();
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress[url] = deferred.promise;
            $http.get(url).then(function(response) {
                if (!angular.isArray(response.data.refs)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var refs = [];
                for (var index = 0; index < response.data.refs.length; index++) {
                    var ref = response.data.refs[index];
                    if (ref.id === 'master') {
                        ref.type = 'Branch';
                    }
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
            if (result) {
                deferred.resolve(result);
            } else {
                deferred.reject({status: 404, data: '', message: "Ref not found"});
            }
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    var createRef = function(refOb, projectId) {
        var deferred = $q.defer();
        var url = URLService.getRefsURL(projectId);
        $http.post(url, {'refs': [refOb], 'source': ApplicationService.getSource()})
        .then(function(response) {
            if (!angular.isArray(response.data.refs) || response.data.refs.length === 0) {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                return;
            }
            var resp = response.data.refs[0];
            var list = CacheService.get(['refs', projectId]);
            if (list) {
                list.push(resp);
            }
            deferred.resolve(CacheService.put(['ref', projectId, resp.id], resp));
        }, function(response) {
            URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    };

    var updateRef = function(refOb, projectId) {
        var deferred = $q.defer();
        var url = URLService.getRefsURL(projectId);
        $http.post(url, {'refs': [refOb], 'source': ApplicationService.getSource()})
        .then(function(response) {
            if (!angular.isArray(response.data.refs) || response.data.refs.length === 0) {
                deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                return;
            }
            var resp = response.data.refs[0];
            deferred.resolve(CacheService.put(['ref', projectId, resp.id], resp, true));
        }, function(response) {
            URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    };

    var deleteRef = function(refId, projectId) {
        var deferred = $q.defer();
        var url = URLService.getRefURL(projectId, refId);
        $http.delete(url).then(function(response) {
            var key = ['ref', projectId, refId];
            var refOb = CacheService.get(key);
            if (refOb) {
                CacheService.remove(key);
                var list = CacheService.get(['refs', projectId]);
                if (list) {
                    for (var i = 0; i < list.length; i++) {
                        if (list[i].id === refOb.id) {
                            list.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            deferred.resolve('');
        }, function(response) {
            URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
        });
        return deferred.promise;
    };

    var getGroups = function(projectId, refId) {
        refId = refId ? refId : 'master';
        var cacheKey = ['groups', projectId, refId];
        var url = URLService.getGroupsURL(projectId, refId);
        if (inProgress.hasOwnProperty(url)) {
            return inProgress[url];
        }
        var deferred = $q.defer();
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress[url] = deferred.promise;
            $http.get(url).then(function(response) {
                if (!angular.isArray(response.data.groups)) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var groups = [];
                for (var i = 0; i < response.data.groups.length; i++) {
                    var group = response.data.groups[i];
                    CacheService.put(['group', projectId, refId, group._id], group, true);
                    groups.push(CacheService.get(['group', projectId, refId, group._id]));
                }
                CacheService.put(cacheKey, groups, false);
                deferred.resolve(CacheService.get(cacheKey));
            }, function(response) {
                URLService.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            }).finally(function() {
                delete inProgress[url];
            });
        }
        return deferred.promise;
    };

    var getGroup = function(id, projectId, refId) {
        var deferred = $q.defer();
        getGroups(projectId, refId).then(function(data) {
            var result = CacheService.get(['group', projectId, refId, id]);
            if (result) {
                deferred.resolve(result);
            } else {
                deferred.reject({status: 404, data: '', message: "Group not found"});
            }
        }, function(reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    /** TODO not supported
     */
    var diff = function(ws1, ws2, ws1time, ws2time, recalc) {
        /*var deferred = $q.defer();
        deferred.resolve(dummy);
        return deferred.promise;*/
        
        if(recalc !== true) recalc = false;

        var w1time = !ws1time ? 'latest' : ws1time;
        var w2time = !ws2time ? 'latest' : ws2time;
        var key = 'diff' + ws1 + ws2 + w1time + w2time;
        if (inProgress.hasOwnProperty(key)) {
            return inProgress[key];
        }
        var deferred = $q.defer();
        inProgress[key] = deferred.promise;
        
        $http.get(URLService.getWsDiffURL(ws1, ws2, w1time, w2time, recalc))
        .success(function(data, status, headers, config) {
            deferred.resolve(data);
            delete inProgress[key];
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[key];
        });
        
        return deferred.promise;
    };

    //TODO not supported
    var merge = function(changes, sourcetime) {
        var deferred = $q.defer();
        $http.post(URLService.getPostWsDiffURL(sourcetime), changes)
        .success(function(data, status, headers, config) {
            deferred.resolve(data);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
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
        getGroups: getGroups,
        getGroup: getGroup,
        createRef: createRef,
        updateRef: updateRef,
        deleteRef: deleteRef,
        reset: reset
    };
}