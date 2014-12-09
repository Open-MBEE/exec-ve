'use strict';

/* Controllers */

angular.module('myApp')
.controller('ToolbarCtrl', ['$scope', '$rootScope', '$timeout', 'UxService',
function($scope, $rootScope, $timeout, UxService) {   
    $scope.tbApi = {};
    $rootScope.tbApi = $scope.tbApi;

    $scope.buttons = [];

    $timeout(function() {
      $scope.tbApi.addButton(UxService.getToolbarButton("configurations"));
      $scope.tbApi.setSelected("configurations", true);
    }, 500);

    $scope.onClick = function(button) {
    };
}])
.controller('NavTreeCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$state', '$anchorScroll', 'ElementService', 'ViewService', 'UtilsService', 'growl', '$modal', '$q', '$filter', 'ws', 'sites', 'config', 'configSnapshots',
function($scope, $rootScope, $location, $timeout, $state, $anchorScroll, ElementService, ViewService, UtilsService, growl, $modal, $q, $filter, ws, sites, config, configSnapshots) {
    $scope.ws = ws;
    $scope.sites = sites;

    $scope.buttons = [{
        action: function(){ $scope.treeApi.expand_all(); },        
        tooltip: "Expand All",
        icon: "fa-caret-square-o-down",
        permission: true
    }, {
        action: function(){ $scope.treeApi.collapse_all(); },
        tooltip: "Collapse All",
        icon: "fa-caret-square-o-up",
        permission: true
    }, {
        action: function(){ $scope.toggleFilter(); },
        tooltip: "Filter Sites",
        icon: "fa-filter",
        permission: true
    }, {
        action: function() {$scope.addDocument();},
        tooltip: "Add Document",
        icon: "fa-plus",
        permission: config == 'latest' ? true : false
    }];

    $scope.filterOn = false;
    $scope.toggleFilter = function() {
        $scope.filterOn = !$scope.filterOn;
    };

    $scope.tooltipPlacement = function(arr) {
        arr[0].placement = "bottom-left";
        for(var i=1; i<arr.length; i++){
            arr[i].placement = "bottom";
        }
    };
    var treeApi = {};
    $scope.tooltipPlacement($scope.buttons);
    $scope.treeApi = treeApi;


    var addDocOrSnapshots = function(site, siteNode) {
        ViewService.getSiteDocuments(site, false, ws)
        .then(function(docs) {
            if (config === 'latest') {
                docs.forEach(function(doc) {
                    var docNode = {
                        label : doc.name,
                        type : "view",
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

    $scope.tree_options = {
        types: {
            "section": "fa fa-file-o fa-fw",
            "view": "fa fa-file fa-fw",
            "site": "fa fa-sitemap fa-fw",
            "snapshot" : "fa fa-camera fa-fw"
        }
    };

    var addDocCtrl = function($scope, $modalInstance) {
        $scope.doc = {name: ""};
        $scope.ok = function() {
            ViewService.createDocument($scope.doc.name, $scope.addDocSite, $scope.ws)
            .then(function(data) {
                growl.success("Document created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Create Document Error: " + reason.message);
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    $scope.addDocument = function() {
        var branch = treeApi.get_selected_branch();
        if (!branch || branch.type !== 'site') {
            growl.error("Select a site to add document under");
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
