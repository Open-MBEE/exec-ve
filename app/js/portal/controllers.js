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

    /*var sortFunction = function(a, b) {
        if (a.children.length > 1) a.children.sort(sortFunction);
        if (b.children.length > 1) b.children.sort(sortFunction);
        if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
        if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;
        return 0;
    };*/


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
.controller('SiteCtrl', ['$rootScope', '$scope', '$stateParams', 'documents', 'config', 'configSnapshots', 'ConfigService', 'growl',
function ($rootScope, $scope, $stateParams, documents, config, configSnapshots, ConfigService, growl) {
    $scope.ws = $stateParams.ws;
    $scope.site = $stateParams.site;
    $scope.documents = documents;
    var docids = [];
    documents.forEach(function(doc) {
        docids.push(doc.sysmlid);
    });
    $scope.configSnapshots = configSnapshots;
    $scope.buttons = [];
    $scope.config = config;
    $rootScope.tree_initial = $scope.site;
    $scope.snapshots = [];
    if (config !== 'latest') {
        configSnapshots.forEach(function(snapshot) {
            if (docids.indexOf(snapshot.sysmlid) > -1)
                $scope.snapshots.push(snapshot);
        });
    }

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
        if (elem.pdfText === 'Generating...')
            return;
        elem.pdfText = "Generating...";
        snapshot.formats.push({"type":"pdf"});
        ConfigService.createSnapshotArtifact(snapshot, $scope.site, $scope.ws).then(
            function(result){
                growl.success('Generating PDF...');
            },
            function(reason){
                growl.error('Failed to generate PDF: ' + reason.message);
            }
        );
    };

    $scope.generateHtml = function(snapshot, elem){
        if (elem.htmlText === 'Generating...')
            return;
        elem.htmlText = "Generating...";
        snapshot.formats.push({"type":"html"});
        ConfigService.createSnapshotArtifact(snapshot, $scope.site, $scope.ws).then(
            function(result){
                growl.success('Generating HTML...');
            },
            function(reason){
                growl.error('Failed to generate HTML: ' + reason.message);
            }
        );
    };
}])
.controller('ToolCtrl', ['$scope', '$rootScope', '$timeout', 'configurations', 'ws',
function($scope, $rootScope, $timeout, configurations, ws) {   
    $scope.ws = ws;
    $scope.show = {configs:true};
    $scope.configurations = configurations;
    $rootScope.togglePane = $scope.$pane;    
}])
.controller('DocCtrl', ['$scope', '$rootScope', 'ws', 'config', '$stateParams', 'site',
function($scope, $rootScope, ws, config, $stateParams, site) {
    $scope.ws = ws;
    if (config === 'latest')
        $scope.time = 'latest';
    else
        $scope.time = $rootScope.portalDocBranch.data.created; //this won't work if ppl go directy to url
    $scope.docid = $stateParams.docid;
    $scope.api = {};
    $scope.site = site;
}]);
