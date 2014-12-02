'use strict';

/* Controllers */

angular.module('myApp')
.controller('NavTreeCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$state', '$anchorScroll', 'document', 'time', 'views', 'ElementService', 'ViewService', 'growl', '$modal', '$q', 'ws',
function($scope, $rootScope, $location, $timeout, $state, $anchorScroll, document, time, views, ElementService, ViewService, growl, $modal, $q, ws) {
    $scope.document = document;
    $rootScope.veTitle = document.name;
    $scope.time = time;
    $scope.ws = ws;
    $scope.editable = $scope.document.editable && time === 'latest';
    if ($state.current.name === 'doc')
        $rootScope.veCurrentView = $scope.document.sysmlid;
    if ($state.current.name === 'doc.all') {
        $rootScope.veFullDocMode = true;
        ViewService.setCurrentViewId(document.sysmlid);
    } else
        $rootScope.veFullDocMode = false;
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
        action: function(){ 
            $rootScope.veFullDocMode = false;
            $scope.buttons[5].tooltip = "Full Document";
            $scope.buttons[5].icon = 'fa-file-text-o';
            $scope.reorder(); 
        },
        tooltip: "Reorder Views",
        icon: "fa-arrows-v",
        permission: $scope.editable
    }, {
        action: function(){ 
            $scope.fullDocMode();
        },
        tooltip: $rootScope.veFullDocMode ? "View Mode" : "Full Document",
        icon: $rootScope.veFullDocMode ? "fa-file-text" : "fa-file-text-o",
        permission: true
    }, {
        action: function() {
            $scope.saveAll();
        },
        tooltip: "Save All Open Edits",
        icon: "fa-save",
        permission: time === 'latest' ? true : false
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
    $rootScope.veTreeApi = treeApi;
    $scope.treeApi = treeApi;

    function addSectionElements(element, viewNode, parentNode) {
        var contains = null;
        if (element.specialization)
            contains = element.specialization.contains;
        else
            contains = element.contains;
        var j = contains.length - 1;
        for (; j >= 0; j--) {
            var containedElement = contains[j];
            if (containedElement.type === "Section") {
                var sectionTreeNode = { 
                    label : containedElement.name, 
                    type : "section",
                    view : viewNode.data.sysmlid,
                    data : containedElement, 
                    children : [] 
                };
                parentNode.children.unshift(sectionTreeNode);
                addSectionElements(containedElement, viewNode, sectionTreeNode);
            }
        }
    }

    var viewId2node = {};
    viewId2node[document.sysmlid] = {
        label: document.name,
        type: 'view',
        data: document,
        children: []
    };
    views.forEach(function(view) {
        var viewTreeNode = { 
            label : view.name, 
            type : "view",
            data : view, 
            children : [] 
        };
        viewId2node[view.sysmlid] = viewTreeNode;
        //addSectionElements(elements[i], viewTreeNode, viewTreeNode);
    });

    document.specialization.view2view.forEach(function(view) {
        var viewid = view.id;
        view.childrenViews.forEach(function(childId) {
            viewId2node[viewid].children.push(viewId2node[childId]);
        });
    });
    $scope.my_data = [viewId2node[document.sysmlid]];

    $scope.my_tree_handler = function(branch) {
        var viewId;

        if (branch.type == "section")
            viewId = branch.view;
        else
            viewId = branch.data.sysmlid;
        if ($rootScope.veFullDocMode) {
            $location.hash(viewId);
            $rootScope.veCurrentView = viewId;
            ViewService.setCurrentViewId(viewId);
            //$rootScope.$broadcast('viewSelected', viewId, viewElements);
            $anchorScroll();
        } else {
            if (viewId !== $rootScope.veCurrentView)
                $rootScope.veViewLoading = true;
            $state.go('doc.view', {viewId: viewId});
        }
    };
    $scope.fullDocMode = function() {
        if ($rootScope.veFullDocMode) {
            $rootScope.veFullDocMode = false;
            $scope.buttons[5].tooltip = "Full Document";
            $scope.buttons[5].icon = 'fa-file-text-o';
            var curBranch = treeApi.get_selected_branch();
            if (curBranch) {
                var viewId;
                if (curBranch.type == 'section')
                    viewId = curBranch.view;
                else
                    viewId = curBranch.data.sysmlid;
                $state.go('doc.view', {viewId: viewId});
            }
        } else {
            if ($state.current.name === 'doc.all') {
                $rootScope.veFullDocMode = true;
                $scope.buttons[5].tooltip = "View Mode";
                $scope.buttons[5].icon = 'fa-file-text';
            } else {
                if (document.specialization.view2view.length > 30) {
                    var instance = $modal.open({
                        templateUrl: 'partials/ve/fullDocWarn.html',
                        controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                            $scope.ok = function() {$modalInstance.close('ok');};
                            $scope.cancel = function() {$modalInstance.close('cancel');};
                        }],
                        size: 'sm'
                    });
                    instance.result.then(function(choice) {
                        if (choice === 'ok') {
                            $rootScope.veFullDocMode = true;
                            $scope.buttons[5].tooltip = "View Mode";
                            $scope.buttons[5].icon = 'fa-file-text';
                            $state.go('doc.all'); 
                        }
                    });
                } else {
                    $rootScope.veFullDocMode = true;
                    $scope.buttons[5].tooltip = "View Mode";
                    $scope.buttons[5].icon = 'fa-file-text';
                    $state.go('doc.all'); 
                }
            }
        }
    };

    $scope.reorder = function() {
        $state.go('doc.order');
    };
    var adding = false;
    $scope.addView = function() {
        if (adding) {
            growl.info('Please wait...');
            return;
        }
        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.error("Add View Error: Select parent view first");
            return;
        }
        if (branch.type === "section") {
            growl.error("Add View Error: Cannot add a child view to a section");
            return;
        }
        adding = true;
        $scope.buttons[3].icon = 'fa-spin fa-spinner';
        ElementService.isCacheOutdated(document.sysmlid, ws)
        .then(function(status) {
            if (status.status) {
                if (!angular.equals(document.specialization.view2view, status.server.specialization.view2view)) {
                    growl.error('The document hierarchy is outdated, refresh the page first!');
                    adding = false;
                    $scope.buttons[3].icon = 'fa-plus';
                    return;
                } 
            } 
            ViewService.createView(branch.data.sysmlid, 'Untitled View', $scope.document.sysmlid, ws)
            .then(function(view) {
                treeApi.add_branch(branch, {
                    label: view.name,
                    type: "view",
                    data: view,
                    children: []
                });
                adding = false;
                $scope.buttons[3].icon = 'fa-plus';
            }, function(reason) {
                growl.error('Add View Error: ' + reason.message);
                adding = false;
                $scope.buttons[3].icon = 'fa-plus';
            });
        }, function(reason) {
            growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
            adding = false;
            $scope.buttons[3].icon = 'fa-plus';
        });
    };
    var savingAll = false;
    $scope.saveAll = function() {
        if (savingAll) {
            growl.info('Please wait...');
            return;
        }
        if (Object.keys($rootScope.veEdits).length === 0) {
            growl.info('Nothing to save');
            return;
        }
        savingAll = true;
        $scope.buttons[6].icon = 'fa-spin fa-spinner';
        var promises = [];
        angular.forEach($rootScope.veEdits, function(value, key) {
            var defer = $q.defer();
            promises.push(defer.promise);
            ElementService.updateElement(value, ws)
            .then(function(e) {
                defer.resolve({status: 200, id: e.sysmlid});
            }, function(reason) {
                defer.resolve({status: reason.status, id: value.sysmlid});
            });
        });
        $q.all(promises).then(function(results) {
            var somefail = false;
            var failed = null;
            results.forEach(function(ob) {
                if (ob.status === 200)
                    delete $rootScope.veEdits[ob.id];
                else {
                    somefail = true;
                    failed = ob.id;
                }
            });
            if (!somefail) {
                var branch = treeApi.get_selected_branch();
                if (branch)
                    branch = branch.data.sysmlid;
                else
                    branch = document.sysmlid;
                growl.success("Save All Successful");
                $rootScope.$broadcast('elementSelected', branch);
            } else {
                $rootScope.$broadcast('elementSelected', failed);
                growl.error("Some elements failed to save, resolve individually in edit pane");
            }
            $scope.buttons[6].icon = 'fa-save';
            savingAll = false;
        });
    };
    $scope.tree_options = {
        types: {
            "section": "fa fa-file-o fa-fw",
            "view": "fa fa-file fa-fw"
        }
    };
    /*ViewService.getDocumentViews(document.sysmlid, false, 'master', time)
    .then(function(fullViews) {
        fullViews.forEach(function(view) {
            var node = viewId2node[view.sysmlid];
            addSectionElements(view, node, node);
        });
        $scope.treeApi.refresh();
    });*/
    function addViewSections(view) {
        var node = viewId2node[view.sysmlid];
        addSectionElements(view, node, node);
        $scope.treeApi.refresh();
    }
    var delay = 500;
    document.specialization.view2view.forEach(function(view, index) {
        $timeout(function() {
            ViewService.getViewElements(view.id, false, ws, time)
            .then(function() {
                ViewService.getView(view.id, false, ws, time)
                .then(addViewSections);
            });
        }, delay*index);
    });
}])
.controller('ReorderCtrl', ['$scope', '$rootScope', 'document', 'time', 'ElementService', 'ViewService', '$state', 'growl', '_', 'ws',
function($scope, $rootScope, document, time, ElementService, ViewService, $state, growl, _, ws) {
    $scope.doc = document;
    ElementService.isCacheOutdated(document.sysmlid, ws)
    .then(function(status) {
        if (status.status) {
            if (!angular.equals(document.specialization.view2view, status.server.specialization.view2view)) {
                growl.error('The document hierarchy is outdated, refresh the page first!');
            } 
        } 
    }, function(reason) {
        growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
    });
    var viewIds2node = {};
    viewIds2node[document.sysmlid] = {
        name: document.name,
        id: document.sysmlid,
        children: []
    };
    var up2dateViews = null;

    ViewService.getDocumentViews(document.sysmlid, false, ws, time, true)
    .then(function(views) {
        up2dateViews = views;
        up2dateViews.forEach(function(view) {
            var viewTreeNode = { 
                id: view.sysmlid, 
                name: view.name, 
                children : [] 
            };
            viewIds2node[view.sysmlid] = viewTreeNode;    
        });
        document.specialization.view2view.forEach(function(view) {
            var viewId = view.id;
            view.childrenViews.forEach(function(childId) {
                viewIds2node[viewId].children.push(viewIds2node[childId]);
            });
        });
        $scope.tree = [viewIds2node[document.sysmlid]];
    });
    $scope.saveClass = "";
    $scope.save = function() {
        $scope.saveClass = "fa fa-spin fa-spinner";
        ElementService.isCacheOutdated(document.sysmlid, ws)
        .then(function(status) {
            if (status.status) {
                if (!angular.equals(document.specialization.view2view, status.server.specialization.view2view)) {
                    growl.error('The document hierarchy is outdated, refresh the page first!');
                    $scope.saveClass = "";
                    return;
                } 
            } 
            var newView2View = [];
            angular.forEach(viewIds2node, function(view) {
                if ($scope.tree.indexOf(view) >= 0 && view.id !== document.sysmlid)
                    return; //allow removing views by moving them to be root
                var viewObject = {id: view.id, childrenViews: []};
                view.children.forEach(function(child) {
                    viewObject.childrenViews.push(child.id);
                });
                newView2View.push(viewObject);
            });
            var newdoc = {};
            newdoc.sysmlid = document.sysmlid;
            newdoc.read = document.read;
            newdoc.specialization = {type: 'Product'};
            newdoc.specialization.view2view = newView2View;
            ViewService.updateDocument(newdoc, ws)
            .then(function(data) {
                growl.success('Reorder Successful');
                //document.specialization.view2view = newView2View;
                $state.go('doc', {}, {reload:true});
            }, function(reason) {
                if (reason.status === 409) {
                    newdoc.read = reason.data.elements[0].read;
                    ViewService.updateDocument(newdoc, ws)
                    .then(function(data2) {
                        growl.success('Reorder Successful');
                        //document.specialization.view2view = newView2View;
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
        }, function(reason) {
            growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
            $scope.saveClass = "";
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
.controller('ViewCtrl', ['$scope', '$rootScope', '$stateParams', 'viewElements', 'ViewService', 'time', 'growl', 'ws',
function($scope, $rootScope, $stateParams, viewElements, ViewService, time, growl, ws) {
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
    $scope.ws = ws;
    $scope.version = time;
    $rootScope.$broadcast('viewSelected', $scope.vid, viewElements);
    $scope.viewApi = {};
    $scope.comments = {};
    $scope.numComments = 0;
    $scope.lastCommented = "";
    $scope.lastCommentedBy = "";
    $scope.tscClicked = function(elementId) {
        $rootScope.$broadcast('elementSelected', elementId);
    };
    $scope.elementTranscluded = function(element, type) {
        if (type === 'Comment' && !$scope.comments.hasOwnProperty(element.sysmlid)) {
            $scope.comments[element.sysmlid] = element;
            $scope.numComments++;
            if (element.modified > $scope.lastCommented) {
                $scope.lastCommented = element.modified;
                $scope.lastCommentedBy = element.creator;
            }
        }
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
.controller('ToolCtrl', ['$scope', '$rootScope', 'document', 'snapshots', 'time', 'site', 'ConfigService', 'ElementService', 'growl', '$modal', 'ws',
function($scope, $rootScope, document, snapshots, time, site, ConfigService, ElementService, growl, $modal, ws) {
    $scope.document = document;
    $scope.ws = ws;
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

    $scope.etrackerChange = function() {
        $scope.specApi.keepMode();
        $scope.eid = $scope.etrackerSelected;
        //$scope.specApi.changeElement($scope.etrackerSelected, 'keep');
    };

    $scope.showTracker = function() {
        if (Object.keys($rootScope.veEdits).length > 1 && $scope.specApi.getEditing())
            return true;
        return false;
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
        ConfigService.getProductSnapshots($scope.document.sysmlid, $scope.site.name, $scope.ws, true)
        .then(function(result) {
            $scope.snapshots = result;
            $rootScope.veTbApi.setButtonIcon('snapRefresh', 'fa fa-refresh');
        }, function(reason) {
            growl.error("Refresh Failed: " + reason.message);
            $rootScope.veTbApi.setButtonIcon('snapRefresh', 'fa fa-refresh');
        });
        $rootScope.veTbApi.select('documentSnapshots');
    };

    var creatingSnapshot = false;
    $scope.$on('newSnapshot', function() {
        if (creatingSnapshot) {
            growl.info('Please Wait...');
            return;
        }
        creatingSnapshot = true;
        $rootScope.veTbApi.setButtonIcon('snapNew', 'fa fa-spinner fa-spin');
        ConfigService.createSnapshot($scope.document.sysmlid, site.name, ws)
        .then(function(result) {
            creatingSnapshot = false;
            $rootScope.veTbApi.setButtonIcon('snapNew', 'fa fa-plus');
            growl.success("Snapshot Created: Refreshing...");
            refreshSnapshots();
        }, function(reason) {
            creatingSnapshot = false;
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
        ElementService.getElement(eid, false, ws, time).
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
        if (edit) {
            $scope.etrackerSelected = edit.sysmlid;
            $rootScope.veEdits[edit.sysmlid] = edit;
        }
    });
    $scope.$on('viewSelected', function(event, vid, viewElements) {
        $scope.eid = vid;
        $scope.vid = vid;
        $scope.viewElements = viewElements;
        $rootScope.veTbApi.select('elementViewer');
        showPane('element');
        ElementService.getElement(vid, false, ws, time).
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
    
    var elementSaving = false;
    $scope.$on('elementSave', function() {
        if (elementSaving) {
            growl.info('Please Wait...');
            return;
        }
        elementSaving = true;
        $rootScope.veTbApi.setButtonIcon('elementSave', 'fa fa-spin fa-spinner');
        $scope.specApi.save().then(function(data) {
            elementSaving = false;
            growl.success('Save Successful');
            $rootScope.veTbApi.setButtonIcon('elementSave', 'fa fa-save');
            delete $rootScope.veEdits[$scope.specApi.getEdits().sysmlid];
            if (Object.keys($rootScope.veEdits).length > 0) {
                var next = Object.keys($rootScope.veEdits)[0];
                $scope.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.eid = next;
            } else {
                $scope.specApi.setEditing(false);
                $rootScope.veTbApi.select('elementViewer');
                setEditingButtonsActive('element', false);
            }
        }, function(reason) {
            elementSaving = false;
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
            delete $rootScope.veEdits[$scope.specApi.getEdits().sysmlid];
            $scope.specApi.revertEdits();
            if (Object.keys($rootScope.veEdits).length > 0) {
                var next = Object.keys($rootScope.veEdits)[0];
                $scope.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.eid = next;
            } else {
                $scope.specApi.setEditing(false);
                $rootScope.veTbApi.select('elementViewer');
                setEditingButtonsActive('element', false);
                setEditingButtonsActive('view', false);
                setSnapshotButtonsActive(false);
            }
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
    var viewSaving = false;
    $scope.$on('viewSave', function() {
        if (viewSaving) {
            growl.info('Please Wait...');
            return;
        }
        viewSaving = true;
        $rootScope.veTbApi.setButtonIcon('viewSave', 'fa fa-spin fa-spinner');
        $scope.viewOrderApi.save().then(function(data) {
            viewSaving = false;
            growl.success('Save Succesful');
            $rootScope.veTbApi.setButtonIcon('viewSave', 'fa fa-save');
        }, function(reason) {
            viewSaving = false;
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
.controller('FullDocCtrl', ['$scope', '$rootScope', 'document', 'time', 'ws',
function($scope, $rootScope, document, time, ws) {
    $scope.ws = ws;
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
            icon: "fa-comment-o"
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
            icon: "fa-codepen"
        }
    ];
    $rootScope.veFullDocMode = true;
}]);
