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
    var configSnapshots = {};
    var productSnapshots = {};

    var getConfigs = function(workspace, site) {

    };

    var getSnapshotsForConfig = function(worksapce, site, configId) {

    };

    var getSnapshotsForProduct = function(workspace, site, docId) {

    };

    var updateConfig = function() {

    };

    var createConfig = function() {

    };

    var updateConfigSnapshots = function() {

    };

    return {
        getConfigs : getConfigs,
        getSnapshotsForConfig: getSnapshotsForConfig,
        getSnapshotsForProduct: getSnapshotsForProduct,
        updateConfig: updateConfig,
        createConfig: createConfig,
        updateConfigSnapshots: updateConfigSnapshots
    };
}