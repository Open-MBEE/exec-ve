'use strict';

angular.module('mms')
.factory('WorkspaceService', ['$http', '$q', 'URLService', 'ElementService', 'CacheService', '_', WorkspaceService]);

/**
 * @ngdoc service
 * @name mms.WorkspaceService
 * @requires $http
 * @requires $q
 * 
 * @description
 */
function WorkspaceService($http, $q, URLService, ElementService, CacheService, _) {
    var inProgress = {};

    var getWorkspaces = function(update) {
        var u = !update ? false : update;
        if (inProgress.hasOwnProperty('getWorkspaces'))
            return inProgress.getWorkspaces;
        
        var deferred = $q.defer();
        var cacheKey = ['workspaces'];
        if (CacheService.exists(cacheKey) && !u) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        } 
        inProgress.getWorkspaces = deferred.promise;
        $http.get(URLService.getWorkspacesURL())
        .success(function(data, status, headers, config) {
            CacheService.put(cacheKey, data.workspaces, false, function(workspace, i) {
                return {key: ['workspaces', workspace.id], value: workspace, merge: true};
            });
            deferred.resolve(CacheService.get(cacheKey));
            delete inProgress.getWorkspaces;
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress.getWorkspaces;
        });
        return deferred.promise;
    };

    var getWorkspace = function(wid) {
        var deferred = $q.defer();
        var cacheKey = ['workspaces', wid];
        /*if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        } */
        getWorkspaces(false).then(function(data) {
            var result = CacheService.get(cacheKey);
            if (result)
                deferred.resolve(result);
            else
                deferred.reject({status: 404, data:'', message: 'Workspace not Found'});
        }, function(reason) {
            deferred.reject(reason);
        });
        /*$http.get(URLService.getWorkspaceURL(wid))
        .success(function(data, status, headers, config) {
            CacheService.put(cacheKey, data.workspace[0]);
            deferred.resolve(CacheService.get(cacheKey));
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });*/
        return deferred.promise;
    };

    var getWorkspaceForEdit = function(wid) {
        var deferred = $q.defer();
        var cacheKey = ['workspaces', wid, 'edit'];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            getWorkspace(wid)
            .then(function(data) {
                var edit = _.cloneDeep(data);
                deferred.resolve(CacheService.put(cacheKey, edit, true));
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };

    var diff = function(ws1, ws2, ws1time, ws2time) {
        /*var deferred = $q.defer();
        deferred.resolve(dummy);
        return deferred.promise;*/

        var w1time = !ws1time ? 'latest' : ws1time;
        var w2time = !ws2time ? 'latest' : ws2time;
        var key = 'diff' + ws1 + ws2 + w1time + w2time;
        if (inProgress.hasOwnProperty(key))
            return inProgress[key];
        var deferred = $q.defer();
        inProgress[key] = deferred.promise;
        $http.get(URLService.getWsDiffURL(ws1, ws2, w1time, w2time))
        .success(function(data, status, headers, config) {
            deferred.resolve(data);
            delete inProgress[key];
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[key];
        });
        return deferred.promise;
    };

    //TODO need to update cache for target ws
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

    var deleteWorkspace = function(ws) {
        var deferred = $q.defer();
        $http.delete(URLService.getWorkspaceURL(ws))
        .success(function(data, status, headers, config) {
            var wss = CacheService.get(['workspaces']);
            if (wss) {
                var index = -1;
                for (var i = 0; i < wss.length; i++) {
                    if (wss[i].id === ws) {
                        index = i;
                    }
                }
                if (index !== -1)
                    wss.splice(index, 1);
            }
            CacheService.remove(['workspaces', ws]);
            deferred.resolve(data);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var create = function(ws, update) {
        var deferred = $q.defer();
        $http.post(URLService.getWorkspacesURL(ws), {'workspaces': [ws]} )
        .success(function(data, status, headers, config) {
            var workspace = data.workspaces[0];
            var cacheKey = ['workspaces', workspace.id];
            CacheService.put(cacheKey, workspace, true);
            if (!update) {
                var workspaces = CacheService.get(['workspaces']);
                if (workspaces)
                    workspaces.push(workspace);
            }
            deferred.resolve(workspace);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };
    
    var update = function(ws) {
        // there is no distinction between update and create,
        // creating this just for semantic purposes
        return create(ws, true);
    };

    return {
        getWorkspaces: getWorkspaces,
        getWorkspace: getWorkspace,
        getWorkspaceForEdit: getWorkspaceForEdit,
        diff: diff,
        merge: merge,
        deleteWorkspace: deleteWorkspace,
        create: create,
        update: update
    };

}