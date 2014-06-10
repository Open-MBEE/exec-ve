'use strict';

angular.module('mms')
.factory('ConfigService', ['$q', '$http', 'URLService', ConfigService]);

/**
 * @ngdoc service
 * @name mms.ConfigService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * 
 * @description
 */
function ConfigService($q, $http, URLService) {
    
    var siteConfigs = {};
    var configs = {};
    var snapshots = {};
    var configSnapshots = {};
    var productSnapshots = {};

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

    var getConfig = function(workspace, site, configId) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (configs.hasOwnProperty(configId)) {
            deferred.resolve(configs[configId]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigURL(ws, site, configId))
        .success(function(data, status, headers, config) {
            configs[configId] = data.configurations;

            deferred.resolve(configs[site]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        // deferred.resolve({description:"something", name:"some name", id:"some id", modified:"2014-03-17T10:41:10.787-07:00"});
        
        return deferred.promise;
    };

    var getSnapshotsForConfig = function(workspace, site, configId) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (configSnapshots.hasOwnProperty(configId)) {
            deferred.resolve(configSnapshots[configId]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigSnapshotURL(ws, site))
        .success(function(data, status, headers, config) {
            configSnapshots[configId] = data.snapshots;

            deferred.resolve(configSnapshots[configId]);
            
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

    var updateConfig = function() {

    };

    var createConfig = function() {

    };

    var updateConfigSnapshots = function() {

    };

    return {
        getConfigs : getConfigs,
        getConfig : getConfig,
        getSnapshotsForConfig: getSnapshotsForConfig,
        getSnapshotsForProduct: getSnapshotsForProduct,
        updateConfig: updateConfig,
        createConfig: createConfig,
        updateConfigSnapshots: updateConfigSnapshots
    };
}