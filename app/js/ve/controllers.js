'use strict';

/* Controllers */

angular.module('myApp')
.controller('NavTreeCtrl', ['$scope', '$rootScope', '$state', 'document', 'time', 'ElementService', 'ViewService', 'growl',
function($scope, $rootScope, $state, document, time, ElementService, ViewService, growl) {
    $scope.document = document;
    $scope.time = time;
    $scope.editable = $scope.document.editable && time === 'latest';
    $rootScope.veCurrentView = $scope.document.sysmlid;
    $scope.buttons = [{
        action: function(){ $scope.my_tree.expand_all(); },        
        tooltip: "Expand All",
        icon: "fa-caret-square-o-down",
        permission: true
    }, {
        action: function(){ $scope.my_tree.collapse_all(); },
        tooltip: "Collapse All",
        icon: "fa-caret-square-o-up",
        permission: true
    }, {
        action: function(){ $scope.toggleFilter(); },
        tooltip: "Filter",
        icon: "fa-filter",
        permission: true
    }, {
        action: function(){ $scope.addView(); },
        tooltip: "Add View",
        icon: "fa-plus",
        permission: $scope.editable
    }, {
        action: function(){ $scope.reorder(); },
        tooltip: "Reorder",
        icon: "fa-arrows-v",
        permission: $scope.editable
    }];
    $scope.filterOn = false;
    $scope.toggleFilter = function() {
        $scope.filterOn = !$scope.filterOn;
    };
    var treeApi = {};

    $scope.tooltipPlacement = function(arr) {
        arr[0].placement = "bottom-left";
        for(var i=1; i<arr.length; i++){
            arr[i].placement = "bottom";
        }
    };
    $scope.tooltipPlacement($scope.buttons);
    $rootScope.veTreeApi = treeApi;
    $scope.treeApi = treeApi;
      // 1. Iterate over view2view and create an array of all element ids
      // 2. Call get element ids and create a map of element id -> element name structure
      // 3. Iterate over view2view and create a map of element id -> element tree node reference
      
    //ViewService.getDocument($scope.documentid, false, 'master', time)
    //.then(function(data) {

        // Array of all the view element ids
        var viewElementIds = [];

        // Map of view elements from view id -> tree node object
        var viewElementIds2TreeNodeMap = {};
        
        // document id is the root the tree heirarchy
        var rootElementId = document.sysmlid;

        // Iterate through all the views in the view2view attribute
        // view2view is a set of elements with related child views
        // Note: The JSON format is NOT nested - it uses refrencing
        for (var i = 0; i < document.specialization.view2view.length; i++) {

          var viewId = document.specialization.view2view[i].id;
          
          viewElementIds.push(viewId);
        }

        function addSectionElements(element, viewNode, parentNode) {
            var contains = null;
            if (element.specialization)
                contains = element.specialization.contains;
            else
                contains = element.contains;
          for (var j = 0; j < contains.length; j++) {
            var containedElement = contains[j];
            if (containedElement.type === "Section") {
              var sectionTreeNode = { label : containedElement.name, 
                    type : "section",
                    view : viewNode.data.sysmlid,
                    data : containedElement, 
                    children : [] };

              parentNode.children.push(sectionTreeNode);

              addSectionElements(containedElement, viewNode, sectionTreeNode);

            }
          }
        }

        // Call the get element service and pass in all the elements
        ElementService.getElements(viewElementIds, false, 'master', time)
        .then(function(elements) {

          // Fill out all the view names first
          for (var i = 0; i < elements.length; i++) {
            var viewTreeNode = { label : elements[i].name, 
                                  type : "view",
                                  data : elements[i], 
                              children : [] };

            viewElementIds2TreeNodeMap[elements[i].sysmlid] = viewTreeNode;

            addSectionElements(elements[i], viewTreeNode, viewTreeNode);
          }

          for (i = 0; i < document.specialization.view2view.length; i++) {

            var viewId = document.specialization.view2view[i].id;
            
            for (var j = 0; j < document.specialization.view2view[i].childrenViews.length; j++) {
              
              var childViewId = document.specialization.view2view[i].childrenViews[j];

              viewElementIds2TreeNodeMap[viewId].children.push( viewElementIds2TreeNodeMap[childViewId] );

            }
          }

          $scope.my_data = [ viewElementIds2TreeNodeMap[rootElementId] ];

        }, function(reason) {
            if (reason.status === 404)
                growl.error("Error: A view in this doc wasn't found");
            else
                growl.error(reason.data);
        });


    $scope.my_data = [];

    $scope.my_tree_handler = function(branch) {
        var viewId;

        if (branch.type == "section")
            viewId = branch.view;
        else
            viewId = branch.data.sysmlid;

        $state.go('doc.view', {viewId: viewId});

    };

    $scope.reorder = function() {
        $state.go('doc.order');
    };

    $scope.addView = function() {

        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.error("Add View Error: Select parent view first");
            return;
        }
        if (branch.type === "section") {
            growl.error("Add View Error: Cannot add a child view to a section");
            return;
        }

        ViewService.createView(branch.data.sysmlid, 'Untitled View', $scope.document.sysmlid)
        .then(function(view) {
            return treeApi.add_branch(branch, {
                label: view.name,
                type: "view",
                data: view
            });
        });
    };
    $scope.tree_options = {
        types: {
            "section": "fa fa-file-o fa-fw",
            "view": "fa fa-file fa-fw"
        }
    };
}])
.controller('ReorderCtrl', ['$scope', 'document', 'ElementService', 'ViewService', '$state', 'growl',
function($scope, document, ElementService, ViewService, $state, growl) {
    $scope.doc = document;
    var viewElementIds = [];
    var viewElementIds2TreeNodeMap = {};
    var rootElementId = $scope.doc.sysmlid;

    for (var i = 0; i < document.specialization.view2view.length; i++) {
        var viewId = document.specialization.view2view[i].id;
        viewElementIds.push(viewId);
    }
    ElementService.getElements(viewElementIds)
    .then(function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var viewTreeNode = { 
                id: elements[i].sysmlid, 
                name: elements[i].name, 
                children : [] 
            };
            viewElementIds2TreeNodeMap[elements[i].sysmlid] = viewTreeNode;    
        }
        for (i = 0; i < document.specialization.view2view.length; i++) {
            var viewId = document.specialization.view2view[i].id;
            for (var j = 0; j < document.specialization.view2view[i].childrenViews.length; j++) {
                var childViewId = document.specialization.view2view[i].childrenViews[j];
                viewElementIds2TreeNodeMap[viewId].children.push(viewElementIds2TreeNodeMap[childViewId]);
            }
        }
        $scope.tree = [viewElementIds2TreeNodeMap[rootElementId]];
    });

    $scope.save = function() {
        var newView2View = [];
        for (var i = 0; i < viewElementIds.length; i++) {
            var viewObject = {id: viewElementIds[i], childrenViews: []};
            for (var j = 0; j < viewElementIds2TreeNodeMap[viewElementIds[i]].children.length; j++) {
                viewObject.childrenViews.push(viewElementIds2TreeNodeMap[viewElementIds[i]].children[j].id);
            }
            newView2View.push(viewObject);
        }
        document.specialization.view2view = newView2View;
        ViewService.updateDocument(document)
        .then(function(data) {
            growl.success('Reorder Successful');
            $state.go('doc', {}, {reload:true});
        }, function(reason) {
            growl.error('Reorder Save Error: ' + reason.message);
        });
    };
}])
.controller('ViewCtrl', ['$scope', '$rootScope', '$stateParams', 'viewElements', 'ViewService', 'time', 'growl',
function($scope, $rootScope, $stateParams, viewElements, ViewService, time, growl) {
    ViewService.setCurrentViewId($stateParams.viewId);
    $rootScope.veCurrentView = $stateParams.viewId;
    $scope.vid = $stateParams.viewId;
    $scope.version = time;
    $rootScope.$broadcast('viewSelected', $scope.vid, viewElements);
    $scope.viewApi = {};
    $scope.tscClicked = function(elementId) {
        $scope.eid = elementId;      //$state.go('view.element', {elementId: elementId});
        $rootScope.$broadcast('elementSelected', elementId);
        $scope.showSpec = true;
        $scope.$apply();
    };
    $scope.toggleShowElements = function() {
        $scope.viewApi.toggleShowElements();
    };
    $scope.toggleShowComments = function() {
        $scope.viewApi.toggleShowComments();
    };
    $scope.nextSection = function() {
        $rootScope.veTreeApi.select_next_branch();
    };
    $scope.prevSection = function() {
        $rootScope.veTreeApi.select_prev_branch();
    };
}])
.controller('ToolbarCtrl', ['$scope', '$rootScope',
function($scope, $rootScope) {   
    $scope.tbApi = {};
    $rootScope.veTbApi = $scope.tbApi;

    $scope.buttons = [
        {id: 'elementViewer', icon: 'fa fa-eye', selected: true, active: true, tooltip: 'Element', 
            onClick: function() {$rootScope.$broadcast('elementViewerSelected');}},
        {id: 'elementEditor', icon: 'fa fa-edit', selected: false, active: true, tooltip: 'Edit Element',
            onClick: function() {$rootScope.$broadcast('elementEditorSelected');}},
        {id: 'viewStructEditor', icon: 'fa fa-bars', selected: false, active: true, tooltip: 'Edit View',
            onClick: function() {$rootScope.$broadcast('viewStructEditorSelected');}},
        {id: 'documentSnapshots', icon: 'fa fa-camera', selected: false, active: true, tooltip: 'Snapshots',
            onClick: function() {$rootScope.$broadcast('snapshotsSelected');}},
        {id: 'elementSave', icon: 'fa fa-save', selected: false, active: false, tooltip: 'Save',
            onClick: function() {$rootScope.$broadcast('elementSave');}},
        {id: 'elementCancel', icon: 'fa fa-times', selected: false, active: false, tooltip: 'Cancel',
            onClick: function() {$rootScope.$broadcast('elementCancel');}},
        {id: 'viewSave', icon: 'fa fa-save', selected: false, active: false, tooltip: 'Save',
            onClick: function() {$rootScope.$broadcast('viewSave');}},
        {id: 'viewCancel', icon: 'fa fa-times', selected: false, active: false, tooltip: 'Cancel',
            onClick: function() {$rootScope.$broadcast('viewCancel');}},
    ];

    $scope.onClick = function(button) {
    };
}])
.controller('ToolCtrl', ['$scope', '$rootScope', 'document', 'snapshots', 'time', 'site', 'ConfigService', 'ElementService', 'growl',
function($scope, $rootScope, document, snapshots, time, site, ConfigService, ElementService, growl) {
    $scope.document = document;
    $scope.editable = document.editable && time === 'latest';
    $scope.snapshots = snapshots;
    $scope.site = site;
    $scope.version = time;
    $scope.eid = $scope.document.sysmlid;
    $scope.vid = $scope.eid;

    $scope.specApi = {};
    $scope.viewOrderApi = {};

    $scope.show = {
        element: true,
        reorder: false,
        snapshots: false
    };

    var setEditingButtonsActive = function(type, active) {
        $rootScope.veTbApi.setActive(type + 'Save', active);
        $rootScope.veTbApi.setActive(type + 'Cancel', active);
    };

    var showPane = function(pane) {
        angular.forEach($scope.show, function(value, key) {
            if (key === pane)
                $scope.show[key] = true;
            else
                $scope.show[key] = false;
        });
    };

    $scope.createNewSnapshot = function() {
        ConfigService.createSnapshot($scope.document.sysmlid)
        .then(function(result) {
            growl.success("Create Successful: wait for email.");
        }, function(reason) {
            growl.error("Create Failed: " + reason.message);
        });
    };
    $scope.refreshSnapshots = function() {
        ConfigService.getProductSnapshots($scope.document.sysmlid, $scope.site.name, 'master', true)
        .then(function(result) {
        }, function(reason) {
            growl.error("Refresh Failed: " + reason.message);
        });
    };

    $scope.$on('snapshotsSelected', function() {
        showPane('snapshots');
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
    });
    $scope.$on('elementSelected', function(event, eid) {
        $scope.eid = eid;
        $rootScope.veTbApi.select('elementViewer');
        showPane('element');
        ElementService.getElement(eid, false, 'master', time).
        then(function(element) {
            var editable = element.editable && time === 'latest';
            $rootScope.veTbApi.setActive('elementEditor', editable);
        });
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
    });
    $scope.$on('elementViewerSelected', function() {
        $scope.specApi.setEditing(false);
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
        showPane('element');
    });
    $scope.$on('elementEditorSelected', function() {
        $scope.specApi.setEditing(true);
        setEditingButtonsActive('element', true);
        setEditingButtonsActive('view', false);
        showPane('element');
    });
    $scope.$on('viewSelected', function(event, vid, viewElements) {
        $scope.eid = vid;
        $scope.vid = vid;
        $scope.viewElements = viewElements;
        $rootScope.veTbApi.select('elementViewer');
        showPane('element');
        ElementService.getElement(vid, false, 'master', time).
        then(function(element) {
            var editable = element.editable && time === 'latest';
            $rootScope.veTbApi.setActive('elementEditor', editable);
            $rootScope.veTbApi.setActive('viewStructEditor', editable);
        });
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
    });
    $scope.$on('viewStructEditorSelected', function() {
        $scope.viewOrderApi.setEditing(true);
        showPane('reorder');
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', true);
    });
    
    $scope.$on('elementSave', function() {
        $rootScope.veTbApi.setButtonIcon('elementSave', 'fa fa-spin fa-spinner');
        $scope.specApi.save().then(function(data) {
            growl.success('Save Successful');
            $rootScope.veTbApi.setButtonIcon('elementSave', 'fa fa-save');
        }, function(reason) {
            if (reason.type === 'info')
                growl.info(reason.message);
            else if (reason.type === 'warning')
                growl.warning(reason.message);
            else if (reason.type === 'error')
                growl.error(reason.message);
            $rootScope.veTbApi.setButtonIcon('elementSave', 'fa fa-save');
        });
        $rootScope.veTbApi.select('elementEditor');
    });
    $scope.$on('elementCancel', function() {
        $scope.specApi.setEditing(false);
        $scope.specApi.revertEdits();
        $rootScope.veTbApi.select('elementViewer');
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
    });
    $scope.$on('viewSave', function() {
        $rootScope.veTbApi.setButtonIcon('viewSave', 'fa fa-spin fa-spinner');
        $scope.viewOrderApi.save().then(function(data) {
            growl.success('Save Succesful');
            $rootScope.veTbApi.setButtonIcon('viewSave', 'fa fa-save');
        }, function(reason) {
            if (reason.type === 'info')
                growl.info(reason.message);
            else if (reason.type === 'warning')
                growl.warning(reason.message);
            else if (reason.type === 'error')
                growl.error(reason.message);
            $rootScope.veTbApi.setButtonIcon('viewSave', 'fa fa-save');
        });
        $rootScope.veTbApi.select('viewStructEditor');
    });
    $scope.$on('viewCancel', function() {
        $scope.viewOrderApi.revertEdits();
        $rootScope.veTbApi.select('viewStructEditor');
        //$scope.viewOrderApi.setEditing(false);
        //$rootScope.veTbApi.select('viewStructViewer');
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', true);
    });
}]);
