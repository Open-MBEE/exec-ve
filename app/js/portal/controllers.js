'use strict';

/* Controllers */

angular.module('myApp')
.controller('PortalCtrl', ['$scope', 'SiteService', 'sites', 'ws',
    function($scope, SiteService, sites, ws) {
        $scope.ws = ws;
        var categories = {};
        for (var i = 0; i < sites.length; i++) {
            var site = sites[i];
            if (site.categories.length === 0)
                site.categories.push("Uncategorized");
            for (var j = 0; j < site.categories.length; j++) {
                var cat = site.categories[j];
                if (categories.hasOwnProperty(cat)) {
                    categories[cat].push(site);
                } else {
                    categories[cat] = [site];
                }
            }
        }
        $scope.categories = categories;
}])
.controller('ToolbarCtrl', ['$scope', '$rootScope',
function($scope, $rootScope) {   
    $scope.tbApi = {};
    $rootScope.veTbApi = $scope.tbApi;

    $scope.buttons = [
        {id: 'elementViewer', icon: 'fa fa-eye', selected: true, active: true, tooltip: 'Preview Element', 
            onClick: function() {$rootScope.$broadcast('elementViewerSelected');}},
        {id: 'elementEditor', icon: 'fa fa-edit', selected: false, active: true, tooltip: 'Edit Element',
            onClick: function() {$rootScope.$broadcast('elementEditorSelected');}},
        {id: 'viewStructEditor', icon: 'fa fa-arrows-v', selected: false, active: true, tooltip: 'Reorder View',
            onClick: function() {$rootScope.$broadcast('viewStructEditorSelected');}},
        {id: 'documentSnapshots', icon: 'fa fa-camera', selected: false, active: true, tooltip: 'Snapshots',
            onClick: function() {$rootScope.$broadcast('snapshotsSelected');}},
        {id: 'elementSave', icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, tooltip: 'Save',
            onClick: function() {$rootScope.$broadcast('elementSave');}},
        {id: 'elementCancel', icon: 'fa fa-times', dynamic: true, selected: false, active: false, tooltip: 'Cancel',
            onClick: function() {$rootScope.$broadcast('elementCancel');}},
        {id: 'viewSave', icon: 'fa fa-save', pullDown: true, dynamic: true, selected: false, active: false, tooltip: 'Save',
            onClick: function() {$rootScope.$broadcast('viewSave');}},
        {id: 'viewCancel', icon: 'fa fa-times', dynamic: true, selected: false, active: false, tooltip: 'Cancel',
            onClick: function() {$rootScope.$broadcast('viewCancel');}},
        {id: 'snapRefresh', icon: 'fa fa-refresh', pullDown: true, dynamic: true, selected: false, active: false, tooltip: 'Refresh',
            onClick: function() {$rootScope.$broadcast('refreshSnapshots');}},
        {id: 'snapNew', icon: 'fa fa-plus', dynamic: true, selected: false, active: false, tooltip: 'Create Snapshot',
            onClick: function() {$rootScope.$broadcast('newSnapshot');}}
    ];

    $scope.onClick = function(button) {
    };
}])
.controller('NavTreeCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$state', '$anchorScroll', 'ElementService', 'ViewService', 'growl', '$modal', '$q', '$filter', 'ws', 'sites',
function($scope, $rootScope, $location, $timeout, $state, $anchorScroll, ElementService, ViewService, growl, $modal, $q, $filter, ws, sites) {
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


    var buildTreeHierarchy = function (array) {
    	var rootNodes = [];
    	var data2Node = {};

    	// make first pass to create all nodes
    	array.forEach(function(data) {
    		data2Node[data.id] = 
   			{ 
		        label : data.name, 
		        type : data.type,
		        data : data, 
		        children : [] 
        	};
    	});

    	// make second pass to associate data to parent nodes
    	array.forEach(function(data) {
    		if (data.parent)	
 		   		data2Node[data.parent].chlidren.push(data2Node[data.id]);
 		   	else
 		   		rootNodes.push(data2Node[data.id]);
    	});

    	return rootNodes;
    };

    // customized - replace with buildTreeHeirarchy when moving to sites
    var buildTreeHierarchyForSites = function (array) {
    	var rootNodes = [];
    	var data2Node = {};

    	// make first pass to create all nodes
    	array.forEach(function(data) {
    		data.id = data.sysmlid;
    		data.name = data.name;
            // TODO: fix changed to parent
            data.categories = ["Uncategorized"];

    		data2Node[data.name] = 
   			{ 
		        label : data.name, 
		        type : "view",
		        data : data, 
		        children : [] 
        	};

        	if (data.categories.length === 0)
            	data.categories.push("Uncategorized");

        	// make second pass to associate data to parent nodes
			data.categories.forEach(function(category) {
	    		data2Node[category] = 
	   			{ 
			        label : category, 
			        type : "view",
			        data : {name: category}, 
			        children : [] 
	        	};
			});

    	});

    	// make second pass to associate data to parent nodes
    	array.forEach(function(data) {
			data.categories.forEach(function(category) {
		   		data2Node[category].children.push(data2Node[data.name]);
			});
    	});

		// make third pass to find all notes without children
		Object.keys(data2Node).forEach(function(key) {
			data2Node[key].children.sort(function(a, b){
			    if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
			    if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;
			    return 0;
			});

			if (data2Node[key].children.length > 0)
		   		rootNodes.push(data2Node[key]);
		});

		// sort root notes
		rootNodes.sort(function(a, b){
		    if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
		    if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;
		    return 0;
		});

    	return rootNodes;
    };

    /*for (var i = 0; i < sites.length; i++) {
        var site = sites[i];
        if (site.categories.length === 0)
            site.categories.push("Uncategorized");
        for (var j = 0; j < site.categories.length; j++) {
            var cat = site.categories[j];
            if (categories.hasOwnProperty(cat)) {
                categories[cat].push(site);
            } else {
                categories[cat] = [site];
            }
        }
    } */

    var dataTree = buildTreeHierarchyForSites(sites);

    $scope.my_data = dataTree;

    $scope.my_tree_handler = function(branch) {
        $state.go('portal.site', {site: branch.data.id});
    };

    $scope.tree_options = {
        types: {
            "section": "fa fa-file-o fa-fw",
            "view": "fa fa-file fa-fw"
        }
    };

}]);
