'use strict';

/* Controllers */

angular.module('myApp')
.controller('NavTreeCtrl', ['$scope', '$rootScope', '$timeout', '$state', 'document', 'time', 'ElementService', 'ViewService', 'growl',
function($scope, $rootScope, $timeout, $state, document, time, ElementService, ViewService, growl) {
    $scope.document = document;
    $scope.time = time;
    $scope.editable = $scope.document.editable && time === 'latest';
    $rootScope.veCurrentView = $scope.document.sysmlid;
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
        tooltip: "Filter Views",
        icon: "fa-filter",
        permission: true
    }, {
        action: function(){ $scope.addView(); },
        tooltip: "Add View",
        icon: "fa-plus",
        permission: $scope.editable
    }, {
        action: function(){ $scope.reorder(); },
        tooltip: "Reorder Views",
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
        if (viewId !== $rootScope.veCurrentView)
            $rootScope.veViewLoading = true;
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
        $scope.buttons[3].icon = 'fa-spin fa-spinner';
        ViewService.createView(branch.data.sysmlid, 'Untitled View', $scope.document.sysmlid)
        .then(function(view) {
            $scope.buttons[3].icon = 'fa-plus';
            treeApi.add_branch(branch, {
                label: view.name,
                type: "view",
                data: view
            });
        }, function(reason) {
            growl.error('Add View Error: ' + reason.message);
            $scope.buttons[3].icon = 'fa-plus';
        });
    };
    $scope.tree_options = {
        types: {
            "section": "fa fa-file-o fa-fw",
            "view": "fa fa-file fa-fw"
        }
    };
    var delay = 300;
    document.specialization.view2view.forEach(function(view, index) {
        $timeout(function() {ViewService.getViewElements(view.id, false, 'master', time);}, delay*index);
    });
}])
.controller('ReorderCtrl', ['$scope', '$rootScope', 'document', 'ElementService', 'ViewService', '$state', 'growl', '_',
function($scope, $rootScope, document, ElementService, ViewService, $state, growl, _) {
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
    $scope.saveClass = "";
    $scope.save = function() {
        var newView2View = [];
        $scope.saveClass = "fa fa-spin fa-spinner";
        for (var i = 0; i < viewElementIds.length; i++) {
            var viewObject = {id: viewElementIds[i], childrenViews: []};
            for (var j = 0; j < viewElementIds2TreeNodeMap[viewElementIds[i]].children.length; j++) {
                viewObject.childrenViews.push(viewElementIds2TreeNodeMap[viewElementIds[i]].children[j].id);
            }
            newView2View.push(viewObject);
        }
        var newdoc = {};
        newdoc.sysmlid = document.sysmlid;
        newdoc.read = document.read;
        newdoc.specialization = {type: 'Product'};
        newdoc.specialization.view2view = newView2View;
        ViewService.updateDocument(newdoc)
        .then(function(data) {
            growl.success('Reorder Successful');
            $state.go('doc', {}, {reload:true});
        }, function(reason) {
            if (reason.status === 409) {
                newdoc.read = reason.data.elements[0].read;
                ViewService.updateDocument(newdoc)
                .then(function(data2) {
                    growl.success('Reorder Successful');
                    $state.go('doc', {}, {reload:true});
                }, function(reason2) {
                    $scope.saveClass = "";
                    growl.error('Reorder Save Error: ' + reason2.message);
                });
            } else {
                $scope.saveClass = "";
                growl.error('Reorder Save Error: ' + reason.message);
            }
        });
    };
    $scope.cancel = function() {
        var curBranch = $rootScope.veTreeApi.get_selected_branch();
        if (!curBranch)
            $state.go('doc', {}, {reload:true});
        else
            $state.go('doc.view', {viewId: curBranch.data.sysmlid});
    };
}])
.controller('ViewCtrl', ['$scope', '$rootScope', '$stateParams', 'viewElements', 'ViewService', 'time', 'growl',
function($scope, $rootScope, $stateParams, viewElements, ViewService, time, growl) {
    $scope.commentsOn = false;
    $scope.elementsOn = false;

    $scope.buttons = [
        {
            action: function() {
                $scope.viewApi.toggleShowComments();

                if (!$scope.commentsOn) {
                    $scope.buttons[0].icon = "fa-comment";
                    $scope.buttons[0].tooltip = "Hide Comments";
                }
                else {
                    $scope.buttons[0].icon = "fa-comment-o";
                    $scope.buttons[0].tooltip = "Show Comments";
                }

                $scope.commentsOn = !$scope.commentsOn;
            },
            tooltip: "Show Comments",
            icon: "fa-comment-o",
            permission: true
        },
        {
            action: function() {
                $scope.viewApi.toggleShowElements();

                if (!$scope.elementsOn) {
                    $scope.buttons[1].tooltip = "Hide Elements";
                }
                else {
                    $scope.buttons[1].tooltip = "Show Elements";
                }

                $scope.elementsOn = !$scope.elementsOn;
            },
            tooltip: "Show Elements",
            icon: "fa-codepen",
            permission: true
        },
        {
            action: function() {
                var prev = $rootScope.veTreeApi.get_prev_branch($rootScope.veTreeApi.get_selected_branch());
                if (!prev)
                    return;
                $scope.buttons[2].icon = "fa-spinner fa-spin";
                $rootScope.veTreeApi.select_branch(prev);
            },
            tooltip: "Previous",
            icon: "fa-chevron-left",
            permission: true
        },
        {
            action: function() {
                var next = $rootScope.veTreeApi.get_next_branch($rootScope.veTreeApi.get_selected_branch());
                if (!next)
                    return;
                $scope.buttons[3].icon = "fa-spinner fa-spin";
                $rootScope.veTreeApi.select_branch(next);
            },
            tooltip: "Next",
            icon: "fa-chevron-right",
            permission: $scope.editable
        }
    ];

    ViewService.setCurrentViewId($stateParams.viewId);
    $rootScope.veCurrentView = $stateParams.viewId;
    $rootScope.veViewLoading = false;
    $scope.vid = $stateParams.viewId;
    $scope.version = time;
    $rootScope.$broadcast('viewSelected', $scope.vid, viewElements);
    $scope.viewApi = {};
    $scope.tscClicked = function(elementId) {
        $rootScope.$broadcast('elementSelected', elementId);
    };
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
.controller('ToolCtrl', ['$scope', '$rootScope', 'document', 'snapshots', 'time', 'site', 'ConfigService', 'ElementService', 'growl', '$modal',
function($scope, $rootScope, document, snapshots, time, site, ConfigService, ElementService, growl, $modal) {
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

    if (!$rootScope.veEdits)
        $rootScope.veEdits = {};

    $scope.snapshotClicked = function() {
        $scope.snapshotLoading = 'fa fa-spinner fa-spin';
    };

    var setEditingButtonsActive = function(type, active) {
        $rootScope.veTbApi.setActive(type + 'Save', active);
        $rootScope.veTbApi.setActive(type + 'Cancel', active);
    };

    var setSnapshotButtonsActive = function(active) {
        $rootScope.veTbApi.setActive('snapRefresh', active);
        $rootScope.veTbApi.setActive('snapNew', $scope.editable && active);
    };

    var showPane = function(pane) {
        angular.forEach($scope.show, function(value, key) {
            if (key === pane)
                $scope.show[key] = true;
            else
                $scope.show[key] = false;
        });
    };

    var refreshSnapshots = function() {
        $rootScope.veTbApi.setButtonIcon('snapRefresh', 'fa fa-refresh fa-spin');
        ConfigService.getProductSnapshots($scope.document.sysmlid, $scope.site.name, 'master', true)
        .then(function(result) {
            $scope.snapshots = result;
            $rootScope.veTbApi.setButtonIcon('snapRefresh', 'fa fa-refresh');
        }, function(reason) {
            growl.error("Refresh Failed: " + reason.message);
            $rootScope.veTbApi.setButtonIcon('snapRefresh', 'fa fa-refresh');
        });
        $rootScope.veTbApi.select('documentSnapshots');
    };

    $scope.$on('newSnapshot', function() {
        $rootScope.veTbApi.setButtonIcon('snapNew', 'fa fa-spinner fa-spin');
        ConfigService.createSnapshot($scope.document.sysmlid)
        .then(function(result) {
            $rootScope.veTbApi.setButtonIcon('snapNew', 'fa fa-plus');
            growl.success("Snapshot Created: Refreshing...");
            refreshSnapshots();
        }, function(reason) {
            growl.error("Snapshot Creation failed: " + reason.message);
            $rootScope.veTbApi.setButtonIcon('snapNew', 'fa fa-plus');
        });
        $rootScope.veTbApi.select('documentSnapshots');
    });

    $scope.$on('refreshSnapshots', refreshSnapshots);

    $scope.$on('snapshotsSelected', function() {
        showPane('snapshots');
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
        setSnapshotButtonsActive(true);
    });
    $scope.$on('elementSelected', function(event, eid) {
        $scope.eid = eid;
        $rootScope.veTbApi.select('elementViewer');
        showPane('element');
        $scope.specApi.setEditing(false);
        ElementService.getElement(eid, false, 'master', time).
        then(function(element) {
            var editable = element.editable && time === 'latest';
            $rootScope.veTbApi.setActive('elementEditor', editable);
        });
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
        setSnapshotButtonsActive(false);
    });
    $scope.$on('elementViewerSelected', function() {
        $scope.specApi.setEditing(false);
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
        setSnapshotButtonsActive(false);
        showPane('element');
    });
    $scope.$on('elementEditorSelected', function() {
        $scope.specApi.setEditing(true);
        setEditingButtonsActive('element', true);
        setEditingButtonsActive('view', false);
        setSnapshotButtonsActive(false);
        showPane('element');
        var edit = $scope.specApi.getEdits();
        if (edit)
            $rootScope.veEdits[edit.sysmlid] = edit;
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
        setSnapshotButtonsActive(false);
        $scope.specApi.setEditing(false);
    });
    $scope.$on('viewStructEditorSelected', function() {
        $scope.viewOrderApi.setEditing(true);
        showPane('reorder');
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', true);
        setSnapshotButtonsActive(false);
    });
    
    $scope.$on('elementSave', function() {
        $rootScope.veTbApi.setButtonIcon('elementSave', 'fa fa-spin fa-spinner');
        $scope.specApi.save().then(function(data) {
            growl.success('Save Successful');
            $rootScope.veTbApi.setButtonIcon('elementSave', 'fa fa-save');
            delete $rootScope.veEdits[$scope.specApi.getEdits().sysmlid];
            $scope.specApi.setEditing(false);
            $rootScope.veTbApi.select('elementViewer');
            setEditingButtonsActive('element', false);
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
        var go = function() {
            $scope.specApi.setEditing(false);
            $scope.specApi.revertEdits();
            $rootScope.veTbApi.select('elementViewer');
            setEditingButtonsActive('element', false);
            setEditingButtonsActive('view', false);
            setSnapshotButtonsActive(false);
            delete $rootScope.veEdits[$scope.specApi.getEdits().sysmlid];
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
        $scope.specApi.setEditing(false);
        $scope.viewOrderApi.revertEdits();
        $rootScope.veTbApi.select('elementViewer');
        showPane('element');
        setEditingButtonsActive('element', false);
        setEditingButtonsActive('view', false);
        setSnapshotButtonsActive(false);
    });
}])
.controller('VeCtrl', ['$scope', '$location', '$rootScope', '_', '$window',
function($scope, $location, $rootScope, _, $window) {
    $rootScope.veViewLoading = false;
    $window.addEventListener('beforeunload', function(event) {
        if ($rootScope.veEdits && !_.isEmpty($rootScope.veEdits)) {
            var message = 'You may have unsaved changes, are you sure you want to leave?';
            event.returnValue = message;
            return message;
            //event.preventDefault();
        }
    });
}])
.controller('FullDocCtrl', ['$scope', '$rootScope', 'document', 'time',
function($scope, $rootScope, document, time) {
    var views = [];
    views.push({id: document.sysmlid, api: {}});
    var view2view = document.specialization.view2view;
    var view2children = {};
    view2view.forEach(function(view) {
        view2children[view.id] = view.childrenViews;
    });

    var addToArray = function(viewId, curSection) {
        views.push({id: viewId, api: {}, number: curSection});
        if (view2children[viewId]) {
            var num = 1;
            view2children[viewId].forEach(function(cid) {
                addToArray(cid, curSection + '.' + num);
                num = num + 1;
            });
        }
    };
    var num = 1;
    view2children[document.sysmlid].forEach(function(cid) {
        addToArray(cid, num);
        num = num + 1;
    });
    $scope.version = time;
    $scope.views = views;
    $scope.tscClicked = function(elementId) {
        $rootScope.$broadcast('elementSelected', elementId);
    };
    $scope.commentsOn = false;
    $scope.elementsOn = false;
    $scope.buttons = [
        {
            action: function() {
                $scope.views.forEach(function(view) {
                    view.api.toggleShowComments();
                });
                if (!$scope.commentsOn) {
                    $scope.buttons[0].icon = "fa-comment";
                    $scope.buttons[0].tooltip = "Hide Comments";
                }
                else {
                    $scope.buttons[0].icon = "fa-comment-o";
                    $scope.buttons[0].tooltip = "Show Comments";
                }
                $scope.commentsOn = !$scope.commentsOn;
            },
            tooltip: "Show Comments",
            icon: "fa-comment-o",
        },
        {
            action: function() {
                $scope.views.forEach(function(view) {
                    view.api.toggleShowElements();
                });
                if (!$scope.elementsOn) {
                    $scope.buttons[1].tooltip = "Hide Elements";
                }
                else {
                    $scope.buttons[1].tooltip = "Show Elements";
                }
                $scope.elementsOn = !$scope.elementsOn;
            },
            tooltip: "Show Elements",
            icon: "fa-codepen",
        }
    ];
}]);
