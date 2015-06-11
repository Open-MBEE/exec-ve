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

 //['snapshots', ws, ssid]
 //['products', ws, id, 'snapshots']
 //['configs', ws, id, 'snapshots']
 //['configs', ws, id]
 //['sites', ws, sitename, 'configs']
function ConfigService($q, $http, URLService, CacheService, UtilsService, HttpService, _) {
    var inProgress = {};
    /**
     * @ngdoc method
     * @name mms.ConfigService#getConfigs
     * @methodOf mms.ConfigService
     *
     * @description
     * Get configurations in a worksace
     *
     * @param {string} [workspace=master] Workspace name
     * @param {boolean} [update=false] update from server
     * @returns {Promise} Promise would be resolved with array of configuration objects
     */
    var getConfigs = function(workspace, update) {
        var n = normalize(update, workspace);
        var inProgressKey = 'getConfigs.' + n.ws;
        if (inProgress.hasOwnProperty(inProgressKey)) {
            HttpService.ping(URLService.getConfigsURL(n.ws));
            return inProgress[inProgressKey];
        }
        var deferred = $q.defer();
        var cacheKey = ['workspaces', n.ws, 'configs'];
        if (CacheService.exists(cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        }
        inProgress[inProgressKey] = deferred.promise;
        HttpService.get(URLService.getConfigsURL(n.ws),
        function(data, status, headers, config) {
            CacheService.put(cacheKey, data.configurations, false, function(val, k) {
                return {key: ['configs', n.ws, val.id], value: val, merge: true};
            });
            deferred.resolve(CacheService.get(cacheKey));
            delete inProgress[inProgressKey];
        }, function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[inProgressKey];
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService#getConfig
     * @methodOf mms.ConfigService
     *
     * @description
     * Get configurations in a worksace
     *
     * @param {string} id id of config to get
     * @param {string} [workspace=master] Workspace name
     * @param {boolean} [update=false] update from server
     * @returns {Promise} Promise would be resolved with config object
     */
    var getConfig = function(id, workspace, update) {
        var n = normalize(update, workspace);
        var deferred = $q.defer();
        var cacheKey = ['configs', n.ws, id];
        if (CacheService.exists(cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        }
        getConfigs(workspace, update).then(function(data) {
            var result = CacheService.get(cacheKey);
            if (result)
                deferred.resolve(result);
            else
                deferred.reject({status: 404, message: "Tag not found", data: ""});
        }, function(reason) {
            deferred.reject(reason);
        });
        /*$http.get(URLService.getConfigURL(id, n.ws))
        .success(function(data, status, headers, config) {
            deferred.resolve(CacheService.put(cacheKey, data.configurations[0], true));
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });*/
        return deferred.promise;
    };

    var getConfigForEdit = function(id, workspace) {
        var n = normalize(false, workspace);
        var deferred = $q.defer();
        var cacheKey = ['configs', n.ws, id, 'edit'];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            getConfig(id, workspace, false)
            .then(function(data) {
                var edit = _.cloneDeep(data);
                deferred.resolve(CacheService.put(cacheKey, edit, true));
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService#getConfigSnapshots
     * @methodOf mms.ConfigService
     *
     * @description
     * Get snapshots of a config
     *
     * @param {string} id Config id
     * @param {string} [workspace=master] Workspace name
     * @param {boolean} [update=false] update from server
     * @returns {Promise} Promise would be resolved with array of snapshot objects
     */
    var getConfigSnapshots = function(id, workspace, update) {
        var n = normalize(update, workspace);
        var deferred = $q.defer();
        var cacheKey = ['configs', n.ws, id, 'snapshots'];
        if (CacheService.exists(cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        }
        $http.get(URLService.getConfigSnapshotsURL(id, n.ws))
        .success(function(data, status, headers, config) {
            CacheService.put(cacheKey, data.snapshots, false, function(val, k) {
                return {key: ['snapshots', n.ws, val.id], value: val, merge: true};
            });
            deferred.resolve(CacheService.get(cacheKey));
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };
    /**
     * @ngdoc method
     * @name mms.ConfigService#createConfig
     * @methodOf mms.ConfigService
     *
     * @description
     * Create a new configuration or update existing one
     *
     * @param {Object} config The new config object, must not already have id
     * @param {string} [workspace=master] Workspace name
     * @param {boolean} [update=false] whether this is an update
     * @returns {Promise} Promise would be resolved with the updated config object
     */
    var createConfig = function(config, workspace, update) {
        var n = normalize(null, workspace);
        var deferred = $q.defer();
        /* if (config.hasOwnProperty('id')) {
            deferred.reject({status: 400, message: 'Config create cannot already have id'});
            return deferred.promise;
        } */
        $http.post(URLService.getConfigsURL(n.ws), {'configurations': [config]})
        .success(function(data, status, headers, config) {
            deferred.resolve(CacheService.put(['configs', n.ws, data.id], data, true));
            if (!update) {
                if (CacheService.exists(['workspaces', n.ws, 'configs'])) {
                    CacheService.get(['workspaces', n.ws, 'configs']).push(data);
                }
            }
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService#deleteConfig
     * @methodOf mms.ConfigService
     *
     * @description
     * Delete a config
     *
     * @param {string} configId Id of config to delete
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with server reply
     */
    var deleteConfig = function(configId, workspace) {
        var n = normalize(null, workspace);
        var deferred = $q.defer();
        $http.delete(URLService.getConfigURL(configId, n.ws))
        .success(function(data, status, headers, config) {
            var wscache = CacheService.get(['workspaces', n.ws, 'configs']);
            var cache = CacheService.get(['configs', n.ws, configId]);
            CacheService.remove(['configs', n.ws, configId]);
            if (wscache) {
                var i = wscache.indexOf(cache);
                if (i > -1)
                    wscache.splice(i, 1);
            }
            deferred.resolve(data);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService#getProductSnapshots
     * @methodOf mms.ConfigService
     *
     * @description
     * Get snapshots of a product
     *
     * @param {string} id Product id
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @param {boolean} [update=false] update from server
     * @returns {Promise} Promise would be resolved with array of snapshot objects
     */
    var getProductSnapshots = function(id, site, workspace, update) {
        var n = normalize(update, workspace);
        var deferred = $q.defer();
        var cacheKey = ['products', n.ws, id, 'snapshots'];
        if (CacheService.exists(cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(cacheKey));
            return deferred.promise;
        }
        $http.get(URLService.getProductSnapshotsURL(id, site, n.ws))
        .success(function(data, status, headers, config) {
            CacheService.put(cacheKey, data.snapshots, false, function(val, k) {
                return {key: ['snapshots', n.ws, val.id], value: val, merge: true};
            });
            deferred.resolve(CacheService.get(cacheKey));
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService#createSnapshotArtifact
     * @methodOf mms.ConfigService
     *
     * @description
     * Create artifacts for a snapshot
     *
     * @param {Object} snapshot The snapshot object with artifact types to create
     * @param {string} site The site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with 'ok', the server will send an email to user when done
     */
    var createSnapshotArtifact = function(snapshot, site, workspace){
        var n = normalize(null, workspace);
        var deferred = $q.defer();
        $http.post(URLService.getProductSnapshotsURL(snapshot.sysmlid, site, n.ws), {'snapshots': [snapshot]})
        .success(function(data, status, headers, config){
            deferred.resolve('ok');
        }).error(function(data, status, headers, config){
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var normalize = function(updateFromServer, workspace) {
        return UtilsService.normalize({update: updateFromServer, workspace: workspace, version: null});
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService#update
     * @methodOf mms.ConfigService
     *
     * @description
     * Update existing config
     *
     * @param {Object} config The config object with updates
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with the updated config object
     */
    var update = function(config, workspace) {
        return createConfig(config, workspace, true);
    };

    return {
        getConfigs : getConfigs,
        createConfig : createConfig,
        deleteConfig : deleteConfig,
        getConfig : getConfig,
        getConfigForEdit : getConfigForEdit,
        getConfigSnapshots : getConfigSnapshots,
        createSnapshotArtifact: createSnapshotArtifact,
        update : update,
        getProductSnapshots: getProductSnapshots,
    };
}