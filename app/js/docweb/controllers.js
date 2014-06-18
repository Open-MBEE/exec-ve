'use strict';

/* Controllers */

angular.module('myApp')
  .controller('ConfigsCtrl', ["$scope", "$http", "$state", "$stateParams",  "configs", function($scope, $http, $state, $stateParams, configs) {

  	$scope.configs = configs;
    $scope.site = $stateParams.site;

    $scope.select_config_view = function(configId) {
        $state.go('docweb.config', {configId: configId});
    };

    $scope.get_latest_drafts = function() {
        $state.go('docweb.latest');
    };

    $scope.create_new_config = function() {
        $state.go('docweb.new');
    };
  }])
  .controller('ConfigCtrl', ["$scope", "$http", "$state", "$stateParams", "ConfigService", "_", "config", "configSnapshots", "products", "site", "growl", 
        function($scope, $http, $state, $stateParams, ConfigService, _, config, configSnapshots, products, site, growl) {

    $scope.config = config;
    $scope.configForEdit = _.cloneDeep(config);
    $scope.configSnapshots = configSnapshots;
    $scope.products = products;
    $scope.site = site.name;

    $scope.selectedSnapshots = [];
    $scope.snapshotMap = {};

    $scope.snapshotMap = {};
    for (var i = 0; i < configSnapshots.length; i++) {
        // $scope.selectedSnapshots.push(snapshots[i].sysmlid);
        $scope.snapshotMap[configSnapshots[i].sysmlid] = configSnapshots[i];
    }
    
    $scope.toggles = {hideChangeForm: true, hideAddRemoveForm: true};

    $scope.toggleChangeForm = function() {
        $scope.toggles.hideChangeForm = !$scope.toggles.hideChangeForm;
    };
    $scope.toggleAddRemoveForm = function() {
        $scope.toggles.hideAddRemoveForm = !$scope.toggles.hideAddRemoveForm;
    };

    $scope.toggleCheck = function(id) {
        var index = $scope.selectedSnapshots.indexOf(id);
        if (index < 0)
            $scope.selectedSnapshots.push(id);
        else
            $scope.selectedSnapshots.splice(index, 1);
    }

    $scope.update = function() { 
        $scope.configForEdit['snapshots'] = $scope.selectedSnapshots;


        ConfigService.updateConfig($scope.configForEdit, site.name, "master").then(function() {
            $scope.toggles.hideAddRemoveForm = true;
            growl.success('Change Successful');
        });

    };
    
    $scope.change = function() {

        ConfigService.updateConfig($scope.configForEdit, site.name, "master").then(function() {
            $scope.toggles.hideChangeForm = true;
             growl.success('Change Successful');
        });
    };
  }])
  .controller('TagAddRemoveDocCtrl', ["$scope", "$http", "ConfigService", function($scope, $http, ConfigService) {
        
        $scope.showSnapshots = false;

        $scope.toggleShowSnapshots = function() {
            $scope.showSnapshots = !$scope.showSnapshots;
        };
        

        ConfigService.getProductSnapshots($scope.doc.sysmlid, $scope.site, 'master')
        .then(
            function(result) {
                $scope.productSnapshots = result;
                for (var i = 0; i < result.length; i++)
                {
                    $scope.snapshotMap[result[i].sysmlid] = result[i];                  
                }
            },
            function(reason) {
                // growl.error("Create Failed: " + reason.message);
            }
        );
  }])
  .controller('NewCtrl', ["$scope", "$http", "$state", "site", "products", "ConfigService", "growl", 
        function($scope, $http, $state, site, products, ConfigService, growl) {

    $scope.products = products;
    $scope.site = site.name;

    $scope.newConfigName = "";
    $scope.newConfigDesc = "";
    $scope.selected = [];

    $scope.toggleCheck = function(id) {
        var index = $scope.selected.indexOf(id);
        if (index < 0)
            $scope.selected.push(id);
        else
            $scope.selected.splice(index, 1);
    };

    $scope.new = function() {
        
        var products = [];
        if ($scope.selected.length > 0) {
            $scope.selected.forEach(function(pid) {
                products.push(pid);
            });
        }

        var send = {"name": $scope.newConfigName, "description": $scope.newConfigDesc, "products": products};

        ConfigService.createConfig(send, $scope.site, "master")
        .then(
            function(result) {
                growl.success("Create Successful: wait for email.");
                $state.go('docweb');
            },
            function(reason) {
                growl.error("Create Failed: " + reason.message);
            }
        );

        // TODO: Need to post to products with 2nd post call when api is updated

        /* ConfigService.createConfig(send, $scope.site, "master")
        .then(
            function(config) {
                var products = [];
                if ($scope.selected.length > 0) {
                    $scope.selected.forEach(function(pid) {
                        products.push({"sysmlid": pid});
                    });
                    ConfigService.updateConfigProducts(config.id, products, $scope.site, "master")
                    .then(
                        function(result) {
                            growl.success("Create Successful: wait for email.");
                            $state.go('docweb');
                        },
                        function(reason) {
                            growl.error("Create Failed: " + reason.message);
                        }
                    );
                } else {
                    //growl.success
                }
            }, 
            function(reason) {
                growl.error("Create Failed: " + reason.message);
            }
        ); */
    };

  }]);