'use strict';

angular.module('mms')
.factory('ConfigService', ['$q', '$http', 'URLService', '_', ConfigService]);

/**
 * @ngdoc service
 * @name mms.ConfigService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires _
 * 
 * @description
 * This service manages configurations and snapshots of products. A product can 
 * have snapshots that represent a point in time of the product (a version), and
 * configurations are a grouping of these snapshots from different prodcuts. A 
 * configuration can enforce a specific time for the snapshots of its products or 
 * it can be flexible to include snapshots of different times.
 */
function ConfigService($q, $http, URLService, _) {
    
    var siteConfigs = {};            //site name to array of config objects
    var configs = {};                //config id to config object
    var snapshots = {};              //snapshot id to snapshot object
    var configSnapshots = {};        //config id to array of snapshot objects
    var productSnapshots = {};       //product id to array of snapshot objects
    var configProducts = {};         //config id to array of product objects

    /**
     * @ngdoc method
     * @name mms.ConfigService@getSiteConfigs
     * @methodOf mms.ConfigService
     *
     * @description
     * Get configurations in a site
     *
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with array of configuration objects
     */
    var getSiteConfigs = function(site, workspace) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (siteConfigs.hasOwnProperty(site)) {
            deferred.resolve(siteConfigs[site]);
            return deferred.promise;
        }
        
        $http.get(URLService.getSiteConfigsURL(site, ws))
        .success(function(data, status, headers, config) {
            siteConfigs[site] = data.configurations;

            data.configurations.forEach(function(config) { 
                configs[config.id] = config; 
            });

            deferred.resolve(siteConfigs[site]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@getConfig
     * @methodOf mms.ConfigService
     *
     * @description
     * Get a configuration by id
     *
     * @param {string} id Config id
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with configuration object
     */
    var getConfig = function(id, site, workspace) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (configs.hasOwnProperty(id)) {
            deferred.resolve(configs[id]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigURL(id, site, ws))
        .success(function(data, status, headers, config) {
            configs[id] = data.configurations[0];

            deferred.resolve(configs[id]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@getConfigProducts
     * @methodOf mms.ConfigService
     *
     * @description
     * Get a snapshots of a configuration
     *
     * @param {string} id Config id
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with array of product objects
     */
    var getConfigProducts = function(id, site, workspace) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (configProducts.hasOwnProperty(id)) {
            deferred.resolve(configProducts[id]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigProductsURL(id, site, ws))
        .success(function(data, status, headers, config) {
            configProducts[id] = data.products;

            deferred.resolve(configProducts[id]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@getConfigSnapshots
     * @methodOf mms.ConfigService
     *
     * @description
     * Get a snapshots of a configuration
     *
     * @param {string} id Config id
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with array of snapshot objects
     */
    var getConfigSnapshots = function(id, site, workspace) {

        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (configSnapshots.hasOwnProperty(id)) {
            deferred.resolve(configSnapshots[id]);
            return deferred.promise;
        }
        
        $http.get(URLService.getConfigSnapshotsURL(id, site, ws))
        .success(function(data, status, headers, config) {
            configSnapshots[id] = data.snapshots;

            deferred.resolve(configSnapshots[id]);
            
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@getProductSnapshots
     * @methodOf mms.ConfigService
     *
     * @description
     * Get snapshots of a product
     *
     * @param {string} id Product id
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @param {boolean} [updateFromServer=false] get from server
     * @returns {Promise} Promise would be resolved with array of snapshot objects
     */
    var getProductSnapshots = function(id, site, workspace, updateFromServer) {
        var ws = !workspace ? 'master' : workspace;
        var update = !updateFromServer ? false : updateFromServer;

        var deferred = $q.defer();

        if (productSnapshots.hasOwnProperty(id) && !update) {
            deferred.resolve(productSnapshots[id]);
            return deferred.promise;
        }
        $http.get(URLService.getProductSnapshotsURL(id, site, ws))
        .success(function(data, status, headers, config) {
            if (productSnapshots.hasOwnProperty(id))
                _.merge(productSnapshots[id], data.snapshots);
            else
                productSnapshots[id] = data.snapshots;
            deferred.resolve(productSnapshots[id]);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@updateConfig
     * @methodOf mms.ConfigService
     *
     * @description
     * Update properties of a configuration
     *
     * @param {Object} config The config object with updated properties
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with the updated config object
     */
    var updateConfig = function(config, site, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();
        if (!config.hasOwnProperty('id'))
            deferred.reject({status: 200, message: 'Config id not found, create configuration first!'});
        else {
            $http.post(URLService.getSiteConfigsURL(site, ws), {'configurations': [config]})
            .success(function(data, status, headers, c) {
                var resp = data;
                if (configs.hasOwnProperty(config.id))
                    _.merge(configs[config.id], resp);
                else
                    configs[config.id] = resp;

                _.remove(configSnapshots[config.id]);
                _.merge(configSnapshots[config.id], resp.snapshots); // TODO: Remove later    

                deferred.resolve(configs[config.id]);
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
            });
        } 
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@createConfig
     * @methodOf mms.ConfigService
     *
     * @description
     * Create a new configuration 
     *
     * @param {Object} config The new config object
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with the updated config object
     */
    var createConfig = function(config, site, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        if (config.hasOwnProperty('id')) {
            deferred.reject({status: 200, message: 'Config create cannot already have id'});
            return deferred.promise;
        } 

        $http.post(URLService.getSiteConfigsURL(site, ws), {'configurations': [config]})
        .success(function(data, status, headers, config) {
            var resp = data;
            configs[resp.id] = resp;
            deferred.resolve(configs[resp.id]);
            if (siteConfigs.hasOwnProperty(site)) {
                siteConfigs[site].push(configs[resp.id]);
            }

        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@updateConfigSnapshots
     * @methodOf mms.ConfigService
     *
     * @description
     * Update a configuration's associated snapshots 
     *
     * @param {string} id The id of the config to update
     * @param {Array.<Object>} snapshots Array of snapshot objects
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with array of snapshot objects
     */
    var updateConfigSnapshots = function(id, snapshots, site, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        $http.post(URLService.getConfigSnapshotsURL(id, site, ws), {'snapshots': snapshots})
        .success(function(data, status, headers, config) {
            deferred.resolve("ok");
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ConfigService@updateConfigProducts
     * @methodOf mms.ConfigService
     *
     * @description
     * Update a configuration's associated products
     *
     * @param {string} id The id of the config to update
     * @param {Array.<Object>} products Array of product objects
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with 'ok', and the server 
     *      will email the user when completed
     */
    var updateConfigProducts = function(id, products, site, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();

        $http.post(URLService.getConfigProductsURL(id, site, ws), {'products': products})
        .success(function(data, status, headers, config) {
            deferred.resolve("ok");
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    }; 

    /**
     * @ngdoc method
     * @name mms.ConfigService@createSnapshot
     * @methodOf mms.ConfigService
     *
     * @description
     * Create a new snapshot for a product
     *
     * @param {string} id The id of the product to snapshot
     * @param {string} site Site name
     * @param {string} [workspace=master] Workspace name
     * @returns {Promise} Promise would be resolved with 'ok', and the server 
     *      will email the user when completed
     */
    var createSnapshot = function(id, site, workspace) {
        var ws = !workspace ? 'master' : workspace;
        var deferred = $q.defer();
        $http.post(URLService.getProductSnapshotsURL(id, site, ws))
        .success(function(data, status, headers, config) {
            deferred.resolve("ok");
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    return {
        getSiteConfigs : getSiteConfigs,
        getConfig : getConfig,
        getConfigProducts: getConfigProducts,
        getConfigSnapshots: getConfigSnapshots,
        getProductSnapshots: getProductSnapshots,
        updateConfig: updateConfig,
        createConfig: createConfig,
        updateConfigSnapshots: updateConfigSnapshots,
        updateConfigProducts: updateConfigProducts,
        createSnapshot: createSnapshot
    };
}