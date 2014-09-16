'use strict';

/* Controllers */

angular.module('myApp')
  .controller('ConfigsCtrl', ["$scope", "$http", "$state", "$stateParams",  "configs", 'ws', 
    function($scope, $http, $state, $stateParams, configs, ws) {
    $scope.configs = configs;
    $scope.site = $stateParams.site;
    $scope.ws = ws;
  }])
  .controller('ConfigCtrl', ["$scope", "$http", "$state", "$stateParams", "ConfigService", "_", "config", "configSnapshots", "products", "site", "growl", "ws",
        function($scope, $http, $state, $stateParams, ConfigService, _, config, configSnapshots, products, site, growl, ws) {
    $scope.ws = ws;
    $scope.config = config;
    $scope.configForEdit = _.cloneDeep(config);
    $scope.configSnapshots = configSnapshots;
    $scope.configSnapshotIds = [];
    $scope.products = products;
    $scope.site = site.name;

    $scope.snapshotMap = {};

    for (var i = 0; i < configSnapshots.length; i++) {
        $scope.configSnapshotIds.push(configSnapshots[i].id);
    }
    
    $scope.toggles = {hideChangeForm: true, hideAddRemoveForm: true};

    $scope.toggleChangeForm = function() {
        $scope.toggles.hideChangeForm = !$scope.toggles.hideChangeForm;
    };
    $scope.toggleAddRemoveForm = function() {
        $scope.toggles.hideAddRemoveForm = !$scope.toggles.hideAddRemoveForm;
    };
    
    $scope.change = function() {
        ConfigService.updateConfig($scope.configForEdit, site.name, ws).then(
            function(result) {
                $scope.toggles.hideChangeForm = true;
                growl.success('Change Successful');
            },
            function(reason) {
                growl.error("Update Failed: " + reason.message);
            }            
        );
    };

    $scope.getPDFUrl = function(snapshot){
        $scope.pdfText = "Generate PDF";
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf') return formats[i].url;
        }
        return null;
    };

    $scope.getHTMLUrl = function(snapshot){
        if(angular.isUndefined(snapshot)) return null;
        if(snapshot===null) return null;
        $scope.htmlText = "Generate HTML";
        var formats = snapshot.formats;
        if(formats===undefined || formats===null || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html') return formats[i].url;
        }
        return null;
    };

    $scope.generatePdf = function(snapshot, elem){
        elem.pdfText = "Generating...";
        snapshot.formats.push({"type":"pdf"});
        ConfigService.createSnapshotArtifact(snapshot, site.name, 'master').then(
            function(result){
                growl.success('Generating PDF...');
            },
            function(reason){
                growl.error('Failed to generate PDF: ' + reason.message);
            }
        );
    };

    $scope.generateHtml = function(snapshot, elem){
        elem.htmlText = "Generating...";
        snapshot.formats.push({"type":"html"});
        ConfigService.createSnapshotArtifact(snapshot, site.name, 'master').then(
            function(result){
                growl.success('Generating HTML...');
            },
            function(reason){
                growl.error('Failed to generate HTML: ' + reason.message);
            }
        );
    };
    
  }])
  .controller('TagAddRemoveCtrl', ["$scope", "$http", "_", "ConfigService", "growl", 
    function($scope, $http, _, ConfigService, growl) {
    
    $scope.selectedSnapshots = []; 
    $scope.update = function() { 
        // $scope.configForEdit['snapshots'] = $scope.selectedSnapshots;

        var snapshots = [];
        if ($scope.selectedSnapshots.length > 0) {
            $scope.selectedSnapshots.forEach(function(sid) {
                snapshots.push({"id" : sid});
            });
        }

        ConfigService.updateConfigSnapshots($scope.configForEdit.id, snapshots, $scope.site, $scope.ws).then(
            function(result) {
                $scope.toggles.hideAddRemoveForm = true;
         
                $scope.configSnapshots.length = 0;
                for (var i = 0; i < result.length; i++) {
                    $scope.configSnapshots.push(result[i]);
                }

                $scope.configSnapshotIds = [];
                for (i = 0; i < $scope.configSnapshots.length; i++) {
                    $scope.configSnapshotIds.push($scope.configSnapshots[i].id);
                }

                growl.success('Change Successful');
            },
            function(reason) {
                growl.error("Update Failed: " + reason.message);
            }
        );

    };

    $scope.toggleCheck = function(id) {
        var index = $scope.selectedSnapshots.indexOf(id);
        if (index < 0)
            $scope.selectedSnapshots.push(id);
        else
            $scope.selectedSnapshots.splice(index, 1);
    };

  }])
  .controller('TagAddRemoveDocCtrl', ["$scope", "$http", "_", "ConfigService", "growl", 
            function($scope, $http, _, ConfigService, growl) {
        
    $scope.showSnapshots = false;
    $scope.toggleShowSnapshots = function() {
        $scope.showSnapshots = !$scope.showSnapshots;
    };
            
    ConfigService.getProductSnapshots($scope.doc.sysmlid, $scope.site, $scope.ws)
    .then(
        function(result) {
            $scope.productSnapshots = [];
            for (var i = 0; i < result.length; i++)
            {
                $scope.productSnapshots[i] = _.cloneDeep(result[i]);
                $scope.snapshotMap[result[i].id] = $scope.productSnapshots[i];

                // Check to see if the product snapshot is part of the configuration
                var index = $scope.configSnapshotIds.indexOf(result[i].id);
                if (index >= 0)
                {
                    $scope.productSnapshots[i].selected = true;
                    $scope.selectedSnapshots.push(result[i].id);
                }
                else
                    $scope.productSnapshots[i].selected = false;                
            }
        },
        function(reason) {
            growl.error("Product Snapshots Get Failed: " + reason.message);
        }
    );
  }])
  .controller('NewCtrl', ["$scope", "$http", "$state", "site", "products", "ConfigService", "growl", "ws",
        function($scope, $http, $state, site, products, ConfigService, growl, ws) {

    $scope.products = products;
    $scope.site = site.name;
    $scope.ws = ws;
    $scope.newConfigName = "";
    $scope.newConfigDesc = "";
    $scope.selected = [];
    $scope.products.forEach(function(doc) {
        doc.add = false;
    });
    
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
                products.push({"sysmlid" : pid});
            });
        } else {
            growl.error("Create Failed: No Selected Products");
            return;
        }

        var create = {"name": $scope.newConfigName, "description": $scope.newConfigDesc};

        ConfigService.createConfig(create, $scope.site, ws)
        .then(
            function(config) {
                ConfigService.updateConfigProducts(config.id, products, $scope.site, ws)
                .then(
                    function(result) {
                        growl.success("Create Successful: You'll receive a confirmation email soon.");
                        $state.go('docweb');
                    },
                    function(reason) {
                        growl.error("Update of Product Snapshots Failed: " + reason.message);
                    }
                );
            }, 
            function(reason) {
                growl.error("Create of Config Failed: " + reason.message);
            }
        );
    };

  }]);