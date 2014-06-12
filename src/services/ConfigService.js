'use strict';

angular.module('mms')
.factory('ConfigService', ['$q', '$http', 'URLService', '_', ConfigService]);

/**
 * @ngdoc service
 * @name mms.ConfigService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * 
 * @description
 */
function ConfigService($q, $http, URLService, _) {
    
    var siteConfigs = {};
    var configs = {};
    var snapshots = {};
    var configSnapshots = {};
    var productSnapshots = {};
    var configProducts = {};

    var getConfigs = function(workspace, site) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (siteConfigs.hasOwnProperty(site)) {
            deferred.resolve(siteConfigs[site]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigsURL(ws, site))
        .success(function(data, status, headers, config) {
            siteConfigs[site] = data.configurations;

            data.configurations.forEach(function(config) { configs[config.id] = config; });

            deferred.resolve(siteConfigs[site]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        // deferred.resolve([{description:"something", name:"some name", id:"some id", modified:"2014-03-17T10:41:10.787-07:00"}]);
        
        return deferred.promise;
    };

    var getConfig = function(id, site, workspace) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (configs.hasOwnProperty(id)) {
            deferred.resolve(configs[id]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigURL(ws, site, id))
        .success(function(data, status, headers, config) {
            configs[id] = data.configurations;

            deferred.resolve(configs[site]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        // deferred.resolve({description:"something", name:"some name", id:"some id", modified:"2014-03-17T10:41:10.787-07:00"});
        
        return deferred.promise;
    };

    var getSnapshotsForConfig = function(id, site, workspace) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (configSnapshots.hasOwnProperty(id)) {
            deferred.resolve(configSnapshots[id]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigSnapshotURL(id, site, ws))
        .success(function(data, status, headers, config) {
            configSnapshots[id] = data.snapshots;

            deferred.resolve(configSnapshots[id]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        return deferred.promise;
    };

    var getSnapshotsForProduct = function(workspace, site, prodId) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (productSnapshots.hasOwnProperty(prodId)) {
            deferred.resolve(productSnapshots[prodId]);
            return deferred.promise;
        }
        
        $http.get(URLService.getProductSnapshotURL(ws, site))
        .success(function(data, status, headers, config) {
            productSnapshots[prodId] = data.snapshots;

            deferred.resolve(productSnapshots[prodId]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        return deferred.promise;
    };

    var updateConfig = function(config, site, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();
        if (!config.hasOwnProperty('id'))
            deferred.reject('Config id not found, create configuration first!');
        else {
            $http.post(URLService.getConfigsURL(workspace, site), {'configurations': [config]})
            .success(function(data, status, headers, config) {
                var resp = data.configurations[0];
                if (configs.hasOwnProperty(config.id))
                    _.merge(configs[config.id], resp);
                else
                    configs[config.id] = resp;                
                deferred.resolve(configs[config.id]);
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
            });
        } 
        return deferred.promise;
    };

    var createConfig = function(config, site, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (config.hasOwnProperty('id')) {
            deferred.reject({status: 200, message: 'Config create cannot have id'});
            return deferred.promise;
        } 

        $http.post(URLService.getConfigsURL(ws, site), {'configurations': [config]})
        .success(function(data, status, headers, config) {
            if (data.configurations.length > 0) {
                var c = data.configurations[0];
                configs[c.id] = c;
                deferred.resolve(configs[c.id]);
            } else
                deferred.reject({status: 200, "message": "something bad happened"});

        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var updateConfigSnapshots = function() {

    };

    var updateConfigProducts = function(id, products, site, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        $http.post(URLService.getConfigProductURL(id, site, ws), {'elements': products})
        .success(function(data, status, headers, config) {
            deferred.resolve("ok");
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    }; 

    return {
        getConfigs : getConfigs,
        getConfig : getConfig,
        getSnapshotsForConfig: getSnapshotsForConfig,
        getSnapshotsForProduct: getSnapshotsForProduct,
        updateConfig: updateConfig,
        createConfig: createConfig,
        updateConfigSnapshots: updateConfigSnapshots,
        updateConfigProducts: updateConfigProducts
    };
}