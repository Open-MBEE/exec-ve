'use strict';

/* Controllers */

angular.module('myApp')
.controller('ToolbarCtrl', ['$scope', '$rootScope', '$timeout', 'UxService',
function($scope, $rootScope, $timeout, UxService) {   
    $scope.tbApi = {};
    $rootScope.tbApi = $scope.tbApi;

    $scope.buttons = [];
    
    $scope.togglePane = {};

    $timeout(function() {

      $scope.togglePane = $rootScope.togglePane;
      $scope.tbApi.addButton(UxService.getToolbarButton("configurations"));
      $scope.tbApi.setSelected("configurations", true);
    }, 500);

    $scope.onClick = function(button) {
    };
}])
.controller('NavTreeCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$state', '$anchorScroll', 'ElementService', 'ViewService', 'UtilsService', 'growl', '$modal', '$q', '$filter', 'ws', 'sites', 'config', 'configSnapshots', 'UxService',
function($scope, $rootScope, $location, $timeout, $state, $anchorScroll, ElementService, ViewService, UtilsService, growl, $modal, $q, $filter, ws, sites, config, configSnapshots, UxService) {
    $scope.ws = ws;
    $scope.sites = sites;

    $scope.bbApi = {};
    $rootScope.bbApi = $scope.bbApi;

    $scope.buttons = [];

    $timeout(function() {
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.expand"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.collapse"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.filter"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.document"));
      $scope.bbApi.setPermission("tree.add.document", config == 'latest' ? true : false);
    }, 500);

    $scope.$on('tree.expand', function() {
        $scope.treeApi.expand_all();
    });

    $scope.$on('tree.collapse', function() {
        $scope.treeApi.collapse_all();
    });

    $scope.$on('tree.filter', function() {
        $scope.toggleFilter();
    });

    $scope.$on('tree.add.document', function() {
        $scope.addDocument();
    });

    $scope.filterOn = false;
    $scope.toggleFilter = function() {
        $scope.filterOn = !$scope.filterOn;
    };

    var treeApi = {};
    $scope.treeApi = treeApi;

    var addDocOrSnapshots = function(site, siteNode) {
        ViewService.getSiteDocuments(site, false, ws, config === 'latest' ? 'latest' : config.timestamp)
        .then(function(docs) {
            if (config === 'latest') {
                docs.forEach(function(doc) {
                    var docNode = {
                        label : doc.name,
                        type : 'view',
                        data : doc,
                        site : site,
                        children : []
                    };
                    siteNode.children.unshift(docNode);
                });
            } else {
                var docids = [];
                docs.forEach(function(doc) {
                    docids.push(doc.sysmlid);
                });
                configSnapshots.forEach(function(snapshot) {
                    if (docids.indexOf(snapshot.sysmlid) > -1) {
                        snapshot.name = snapshot.sysmlname;
                        var snapshotNode = {
                            label : snapshot.sysmlname,
                            type : 'snapshot',
                            data : snapshot,
                            site : site,
                            children : []
                        };
                        siteNode.children.unshift(snapshotNode);
                    }
                });
            }
            if ($scope.treeApi.refresh)
                $scope.treeApi.refresh();
        }, function(reason) {

        });
    };

    var dataTree = UtilsService.buildTreeHierarchy(sites, "sysmlid", "site", "parent", addDocOrSnapshots);

    $scope.my_data = dataTree;

    $scope.my_tree_handler = function(branch) {
        if (branch.type === 'site') {
            $state.go('portal.site', {site: branch.data.sysmlid});
        } else if (branch.type === 'view' || branch.type === 'snapshot') {
            $rootScope.portalDocBranch = branch;
            $state.go('portal.site.view', {site: branch.site, docid: branch.data.sysmlid});
        } 
    };

    var sortFunction = function(a, b) {
        if (a.type != b.type && a.type === 'view') return -1;
        if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
        if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;
        return 0;
    };

    $scope.tree_options = {
        types: UxService.getTreeTypes(),
        sort: sortFunction
    };

    var addDocCtrl = function($scope, $modalInstance) {
        $scope.doc = {name: ""};
        $scope.oking = false;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            ViewService.createDocument($scope.doc.name, $scope.addDocSite, $scope.ws)
            .then(function(data) {
                growl.success("Document created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Create Document Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    $scope.addDocument = function() {
        var branch = treeApi.get_selected_branch();
        if (!branch || branch.type !== 'site') {
            growl.warning("Select a site to add document under");
            return;
        }
        $scope.addDocSite = branch.data.sysmlid;
        var instance = $modal.open({
            templateUrl: 'partials/portal/newDoc.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', addDocCtrl]
        });
        instance.result.then(function(data) {
            var newbranch = {
                label: data.name,
                type: 'view',
                data: data,
                children: [],
                site: branch.data.sysmlid
            };
            treeApi.add_branch(branch, newbranch);
        });
    };

    $timeout(function() {
        $scope.treeApi.refresh();
    }, 5000);

}])
.controller('SiteCtrl', ['$rootScope', '$scope', '$stateParams', 'documents', 'config', 'configSnapshots', 'siteCoverDoc', 'ConfigService', 'ElementService', 'growl', '$modal',
function ($rootScope, $scope, $stateParams, documents, config, configSnapshots, siteCoverDoc, ConfigService, ElementService, growl, $modal) {
    $scope.ws = $stateParams.ws;
    $scope.site = $stateParams.site;
    $scope.time = 'latest';
    if (config !== 'latest')
        $scope.time = config.timestamp;

    $scope.siteCoverDoc = siteCoverDoc;

    $scope.documents = documents;
    var docids = [];
    documents.forEach(function(doc) {
        docids.push(doc.sysmlid);
    });
    $scope.configSnapshots = configSnapshots;
    $scope.config = config;
    $rootScope.tree_initial = $scope.site;
    $scope.snapshots = [];
    if (config !== 'latest') {
        configSnapshots.forEach(function(snapshot) {
            if (docids.indexOf(snapshot.sysmlid) > -1)
                $scope.snapshots.push(snapshot);
        });
    }

    $scope.getPDFStatus = function(snapshot){
        $scope.pdfText = "Generate PDF";
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf') {
                var status = formats[i].status;
                if(status == 'Generating'){
                    status = 'Generating...';
                }
                else if(status == 'Error') status = 'Regenerate PDF';
                $scope.pdfText = status;
                return status;
            }
        }
        return null;
    };

    $scope.getPDFUrl = function(snapshot){
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf'){
                return formats[i].url;
            }
        }
        return null;
    };

    $scope.getZipStatus = function(snapshot){
        $scope.zipText = "Generate Zip";
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html') {
                var status = formats[i].status;
                if(status == 'Generating') status = 'Generating...';
                else if(status == 'Error') status = 'Regenerate Zip';
                $scope.zipText = status;
                return status;
            }
        }
        return null;
    };

    $scope.getZipUrl = function(snapshot){
        if(angular.isUndefined(snapshot)) return null;
        if(snapshot===null) return null;
        
        var formats = snapshot.formats;
        if(formats===undefined || formats===null || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html'){
                return formats[i].url;  
            } 
        }
        return null;
    };

    $scope.generateArtifacts = function(snapshot, elem){
        snapshot.formats.push({"type":"pdf", "status":"Generating"});
        snapshot.formats.push({"type":"html", "status":"Generating"});
        ConfigService.createSnapshotArtifact(snapshot, $scope.site, $scope.ws).then(
            function(result){
                growl.success('Generating artifacts...');
            },
            function(reason){
                growl.error('Failed to generate artifacts: ' + reason.message);
            }
        );
    };

    $scope.generatePdf = function(snapshot, elem){
        if (elem.pdfText === 'Generating...')
            return;
        $scope.generateArtifacts(snapshot, elem);
    };

    $scope.generateZip = function(snapshot, elem){
        if (elem.zipText === 'Generating...')
            return;
        $scope.generateArtifacts(snapshot, elem);
    };


    $scope.specApi = {};
    $scope.editing = false;
    var elementSaving = false;
    $scope.buttons = [
        {
            action: function() {
                $scope.editing = !$scope.editing;
                $scope.specApi.setEditing(true);
                $scope.buttons[0].permission = false;
                $scope.buttons[1].permission = true;
                $scope.buttons[2].permission = true;
                ElementService.isCacheOutdated(siteCoverDoc.sysmlid, $scope.ws)
                .then(function(data) {
                    if (data.status && data.server.modified > data.cache.modified)
                        growl.warning('This view has been updated on the server');
                });
            },
            tooltip: "Edit Site View",
            icon: "fa-edit",
            permission: siteCoverDoc && siteCoverDoc.editable && config === 'latest'
        },
        {
            action: function() {
                
                    if (elementSaving) {
                        growl.info('Please Wait...');
                        return;
                    }
                    elementSaving = true;
                    $scope.buttons[1].icon = "fa-spin fa-spinner";
                    $scope.specApi.save().then(function(data) {
                        elementSaving = false;
                        growl.success('Save Successful');
                        $scope.editing = false;
                        $scope.buttons[0].permission = true;
                        $scope.buttons[1].permission = false;
                        $scope.buttons[2].permission = false;
                    }, function(reason) {
                        elementSaving = false;
                        if (reason.type === 'info')
                            growl.info(reason.message);
                        else if (reason.type === 'warning')
                            growl.warning(reason.message);
                        else if (reason.type === 'error')
                            growl.error(reason.message);
                    }).finally(function() {
                        $scope.buttons[1].icon = "fa-save";
                    });
            },
            tooltip: "Save",
            icon: "fa-save",
            permission: false
        },
        {
            action: function() {
                var go = function() {
                    $scope.specApi.revertEdits();
                    $scope.editing = false;
                    $scope.buttons[0].permission = true;
                    $scope.buttons[1].permission = false;
                    $scope.buttons[2].permission = false;
                };
                if ($scope.specApi.hasEdits()) {
                    var instance = $modal.open({
                        templateUrl: 'partials/ve/cancelConfirm.html',
                        scope: $scope,
                        controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                            $scope.ok = function() {
                                $modalInstance.close('ok');
                            };
                            $scope.cancel = function() {
                                $modalInstance.dismiss();
                            };
                        }]
                    });
                    instance.result.then(function() {
                        go();
                    });
                } else
                    go();
            },
            tooltip:"Cancel",
            icon: "fa-times",
            permission: false
        }
    ];
}])
.controller('ToolCtrl', ['$scope', '$rootScope', '$timeout', 'configurations', 'ws',
function($scope, $rootScope, $timeout, configurations, ws) {   
    $scope.ws = ws;
    $scope.show = {configs:true};
    $scope.configurations = configurations;
    $rootScope.togglePane = $scope.$pane;    
}])
.controller('DocCtrl', ['$scope', '$rootScope', 'ws', 'config', '$stateParams', 'site', 'snapshot', 'ConfigService', 'growl',
function($scope, $rootScope, ws, config, $stateParams, site, snapshot, ConfigService, growl) {
    $scope.ws = ws;
    if (config === 'latest')
        $scope.time = 'latest';
    else
        $scope.time = $rootScope.portalDocBranch.data.created; //this won't work if ppl go directy to url
    $scope.docid = $stateParams.docid;
    $scope.api = {};
    $scope.site = site;
    $scope.snapshot = snapshot;
    $scope.pdfText = "Generate PDF";
    $scope.getPDFStatus = function(){
        
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf') {
                var status = formats[i].status;
                if(status == 'Generating'){
                    status = 'Generating...';
                }
                else if(status == 'Error') status = 'Regenerate PDF';
                $scope.pdfText = status;
                return status;
            }
        }
        return null;
    };

    $scope.getPDFUrl = function(){
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf'){
                return formats[i].url;
            }
        }
        return null;
    };

    $scope.zipText = "Generate Zip";
    $scope.getZipStatus = function(){
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html') {
                var status = formats[i].status;
                if(status == 'Generating') status = 'Generating...';
                else if(status == 'Error') status = 'Regenerate Zip';
                $scope.zipText = status;
                return status;
            }
        }
        return null;
    };

    $scope.getZipUrl = function(){
        if(angular.isUndefined(snapshot)) return null;
        if(snapshot===null) return null;
        
        var formats = snapshot.formats;
        if(formats===undefined || formats===null || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html'){
                return formats[i].url;  
            } 
        }
        return null;
    };

    $scope.generateArtifacts = function(){
        $scope.snapshot.formats.push({"type":"pdf", "status":"Generating"});
        $scope.snapshot.formats.push({"type":"html", "status":"Generating"});
        ConfigService.createSnapshotArtifact($scope.snapshot, $scope.site, $scope.ws).then(
            function(result){
                growl.success('Generating artifacts...');
            },
            function(reason){
                growl.error('Failed to generate artifacts: ' + reason.message);
            }
        );
    };

    $scope.generatePdf = function(){
        if ($scope.pdfText === 'Generating...')
            return;
        $scope.generateArtifacts();
    };

    $scope.generateZip = function(){
        if ($scope.zipText === 'Generating...')
            return;
        $scope.generateArtifacts();
    };
}]);
