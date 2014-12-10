'use strict';

/* Controllers */

angular.module('myApp')
.controller('NavTreeCtrl', ['$scope', '$rootScope', '$location', '$timeout', '$state', '$anchorScroll', 'document', 'time', 'views', 'ElementService', 'ViewService', 'UxService', 'growl', '$modal', '$q', 'ws',
function($scope, $rootScope, $location, $timeout, $state, $anchorScroll, document, time, views, ElementService, ViewService, UxService, growl, $modal, $q, ws) {
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

    $scope.bbApi = {};
    $rootScope.bbApi = $scope.bbApi;

    $scope.buttons = [];

    $timeout(function() {
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.expand"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.collapse"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.filter"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.view"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.reorder.view"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.full.document"));
      $scope.bbApi.setPermission("tree.add.view", $scope.editable);
      $scope.bbApi.setPermission("tree.reorder.view", $scope.editable);
    }, 500);

    $scope.$on('tree.expand', function() {
        $scope.treeApi.expand_all();
    });

    $scope.$on('tree.collapse', function() {
        $scope.treeApi.collapse_all();
    });

    $scope.filterOn = false;
    $scope.$on('tree.filter', function() {
        $scope.bbApi.select('tree.filter');
        $scope.filterOn = $scope.bbApi.getToggleState('tree.filter');
    });

    $scope.$on('tree.add.view', function() {
        $scope.addView();
    });

    $scope.$on('tree.reorder.view', function() {
        $rootScope.veFullDocMode = false;
        $scope.bbApi.setTooltip("tree.full.document", "Full Document");
        $scope.bbApi.setIcon("tree.full.document", 'fa-file-text-o');

        $scope.reorder(); 
    });

    $scope.$on('tree.full.document', function() {
        $scope.fullDocMode();

        $scope.bbApi.setTooltip("tree.full.document", $rootScope.veFullDocMode ? "View Mode" : "Full Document");
        $scope.bbApi.setIcon("tree.full.document", $rootScope.veFullDocMode ? "fa-file-text" : "fa-file-text-o");
    });

    var treeApi = {};
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
            $scope.bbApi.setTooltip("tree.full.document", "Full Document");
            $scope.bbApi.setIcon("tree.full.document", 'fa-file-text-o');
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
                $scope.bbApi.setTooltip("tree.full.document", "View Mode");
                $scope.bbApi.setIcon("tree.full.document", 'fa-file-text');
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
                            $scope.bbApi.setTooltip("tree.full.document", "View Mode");
                            $scope.bbApi.setIcon("tree.full.document", 'fa-file-text');
                            $state.go('doc.all'); 
                        }
                    });
                } else {
                    $rootScope.veFullDocMode = true;
                    $scope.bbApi.setTooltip("tree.full.document", "View Mode");
                    $scope.bbApi.setIcon("tree.full.document", 'fa-file-text');
                    $state.go('doc.all'); 
                }
            }
        }
    };

    $scope.reorder = function() {
        $state.go('doc.order');
    };

    $scope.addView = function() {

        var branch = treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Add View Error: Select parent view first");
            return;
        } else if (branch.type === "section") {
            growl.warning("Add View Error: Cannot add a child view to a section");
            return;
        }

        ElementService.isCacheOutdated(document.sysmlid, ws)
        .then(function(status) {
            if (status.status) {
                if (!angular.equals(document.specialization.view2view, status.server.specialization.view2view)) {
                    growl.error('The document hierarchy is outdated, refresh the page first!');
                    return;
                } 
            } 

            $scope.createViewParentId = branch.data.sysmlid;
            $scope.newView = {};
            $scope.newView.name = "";

            var instance = $modal.open({
                templateUrl: 'partials/ve/new.html',
                scope: $scope,
                controller: ['$scope', '$modalInstance', viewCtrl]
            });
            instance.result.then(function(data) {
              treeApi.add_branch(branch, {
                  label: data.name,
                  type: "view",
                  data: data,
                  children: []
              });
            });

        }, function(reason) {
            growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
        });
    };

    var viewCtrl = function($scope, $modalInstance) {
        $scope.newView = {};
        $scope.newView.name = "";
        $scope.oking = false;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;

            ViewService.createView($scope.createViewParentId, $scope.newView.name, 
                                    $scope.document.sysmlid, ws)
            .then(function(data) {
                growl.success("View Created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Add View Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    $scope.tree_options = {
        types: UxService.getTreeTypes()
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
.controller('ViewCtrl', ['$scope', '$rootScope', '$stateParams', '$timeout', 'viewElements', 'ViewService', 'time', 'growl', 'ws',
function($scope, $rootScope, $stateParams, $timeout, viewElements, ViewService, time, growl, ws) {
    if (!$rootScope.veCommentsOn)
        $rootScope.veCommentsOn = false;
    if (!$rootScope.veElementsOn)
        $rootScope.veElementsOn = false;

    $scope.buttons = [
        {
            action: function() {
                $scope.viewApi.toggleShowComments();

                if (!$rootScope.veCommentsOn) {
                    $scope.buttons[0].icon = "fa-comment";
                    $scope.buttons[0].tooltip = "Hide Comments";
                }
                else {
                    $scope.buttons[0].icon = "fa-comment-o";
                    $scope.buttons[0].tooltip = "Show Comments";
                }

                $rootScope.veCommentsOn = !$rootScope.veCommentsOn;
            },
            tooltip: !$rootScope.veCommentsOn ? "Show Comments" : "Hide Comments",
            icon: !$rootScope.veCommentsOn ? "fa-comment-o" : "fa-comment",
            permission: true
        },
        {
            action: function() {
                $scope.viewApi.toggleShowElements();

                if (!$rootScope.veElementsOn) {
                    $scope.buttons[1].tooltip = "Hide Elements";
                }
                else {
                    $scope.buttons[1].tooltip = "Show Elements";
                }

                $rootScope.veElementsOn = !$rootScope.veElementsOn;
            },
            tooltip: !$rootScope.veElementsOn ? "Show Elements": "Hide Elements",
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

    $timeout(function() {
        $rootScope.$broadcast('viewSelected', $scope.vid, viewElements);
    }, 225);

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
    $timeout(function() {
        if ($rootScope.veCommentsOn) {
            $scope.viewApi.toggleShowComments();
        }
        if ($rootScope.veElementsOn) {
            $scope.viewApi.toggleShowElements();
        }
    }, 500);
}])
.controller('ToolbarCtrl', ['$scope', '$rootScope', '$timeout', 'UxService',
function($scope, $rootScope, $timeout, UxService) {   
    $scope.tbApi = {};

    $scope.buttons = [];

    $timeout(function() {

      $rootScope.tbApi = $scope.tbApi;
      $scope.tbApi.addButton(UxService.getToolbarButton("element.viewer"));
      $scope.tbApi.addButton(UxService.getToolbarButton("element.editor"));
      $scope.tbApi.addButton(UxService.getToolbarButton("view.reorder"));
      $scope.tbApi.addButton(UxService.getToolbarButton("document.snapshot"));
    }, 200);

    $scope.onClick = function(button) {
    };
}])
.controller('ToolCtrl', ['$scope', '$rootScope', 'document', 'snapshots', 'time', 'site', 'ConfigService', 'ElementService', 'growl', '$modal', '$q', 'ws',
function($scope, $rootScope, document, snapshots, time, site, ConfigService, ElementService, growl, $modal, $q, ws) {
    $scope.document = document;
    $scope.ws = ws;
    $scope.editable = document.editable && time === 'latest';
    $scope.snapshots = snapshots;
    $scope.site = site;
    $scope.version = time;
    $scope.eid = $scope.document.sysmlid;
    $scope.vid = $scope.eid;
    $scope.specApi = {};
    $rootScope.veSpecApi = $scope.specApi;
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

    var showPane = function(pane) {
        angular.forEach($scope.show, function(value, key) {
            if (key === pane)
                $scope.show[key] = true;
            else
                $scope.show[key] = false;
        });
    };

    var refreshSnapshots = function() {
        $rootScope.tbApi.toggleButtonSpinner('document.snapshot.refresh');
        ConfigService.getProductSnapshots($scope.document.sysmlid, $scope.site.name, $scope.ws, true)
        .then(function(result) {
            $scope.snapshots = result;
        }, function(reason) {
            growl.error("Refresh Failed: " + reason.message);
        })
        .finally(function() {
            $rootScope.tbApi.toggleButtonSpinner('document.snapshot.refresh');
            $rootScope.tbApi.select('document.snapshot');

        });
    };

    var creatingSnapshot = false;
    $scope.$on('document.snapshot.create', function() {
        if (creatingSnapshot) {
            growl.info('Please Wait...');
            return;
        }
        creatingSnapshot = true;
        $rootScope.tbApi.toggleButtonSpinner('document.snapshot.create');
        ConfigService.createSnapshot($scope.document.sysmlid, site.name, ws)
        .then(function(result) {
            creatingSnapshot = false;
            $rootScope.tbApi.toggleButtonSpinner('document.snapshot.create');
            growl.success("Snapshot Created: Refreshing...");
            refreshSnapshots();
        }, function(reason) {
            creatingSnapshot = false;
            growl.error("Snapshot Creation failed: " + reason.message);
            $rootScope.tbApi.toggleButtonSpinner('document.snapshot.create');
        });
        $rootScope.tbApi.select('document.snapshot');
    });

    $scope.$on('document.snapshot.refresh', refreshSnapshots);

    $scope.$on('document.snapshot', function() {
        showPane('snapshots');
    });
    $scope.$on('elementSelected', function(event, eid) {
        $scope.eid = eid;
        $rootScope.tbApi.select('element.viewer');
        showPane('element');
        $scope.specApi.setEditing(false);
        ElementService.getElement(eid, false, ws, time).
        then(function(element) {
            var editable = element.editable && time === 'latest';
            $rootScope.tbApi.setPermission('element.editor', editable);
            $rootScope.tbApi.setPermission("document.snapshot.create", editable);
        });
    });
    $scope.$on('element.viewer', function() {
        $scope.specApi.setEditing(false);
        showPane('element');
    });
    $scope.$on('element.editor', function() {
        $scope.specApi.setEditing(true);
        showPane('element');
        var edit = $scope.specApi.getEdits();
        if (edit) {
            $scope.etrackerSelected = edit.sysmlid;
            $rootScope.veEdits[edit.sysmlid] = edit;
            $rootScope.tbApi.setIcon('element.editor', 'fa-edit-asterisk');
            if (Object.keys($rootScope.veEdits).length > 1) {
                $rootScope.tbApi.setPermission('element.editor.saveall', true);
            } else {
                $rootScope.tbApi.setPermission('element.editor.saveall', false);
            }
        }
    });
    $scope.$on('viewSelected', function(event, vid, viewElements) {
        $scope.eid = vid;
        $scope.vid = vid;
        $scope.viewElements = viewElements;
        $rootScope.tbApi.select('element.viewer');
        showPane('element');
        ElementService.getElement(vid, false, ws, time).
        then(function(element) {
            var editable = element.editable && time === 'latest';
            $rootScope.tbApi.setPermission('element.editor', editable);
            $rootScope.tbApi.setPermission('view.reorder', editable);
            $rootScope.tbApi.setPermission("document.snapshot.create", editable);
        });
        $scope.specApi.setEditing(false);
    });
    $scope.$on('view.reorder', function() {
        $scope.viewOrderApi.setEditing(true);
        showPane('reorder');
    });
    
    var elementSaving = false;
    $scope.$on('element.editor.save', function() {
        if (elementSaving) {
            growl.info('Please Wait...');
            return;
        }
        elementSaving = true;
        $rootScope.tbApi.toggleButtonSpinner('element.editor.save');
        $scope.specApi.save().then(function(data) {
            elementSaving = false;
            growl.success('Save Successful');
            $rootScope.tbApi.toggleButtonSpinner('element.editor.save');
            delete $rootScope.veEdits[$scope.specApi.getEdits().sysmlid];
            if (Object.keys($rootScope.veEdits).length > 0) {
                var next = Object.keys($rootScope.veEdits)[0];
                $scope.etrackerSelected = next;
                $scope.specApi.keepMode();
                $scope.eid = next;
            } else {
                $scope.specApi.setEditing(false);
                $rootScope.tbApi.select('element.viewer');
                if (Object.keys($rootScope.veEdits).length === 0) {
                    $rootScope.tbApi.setIcon('element.editor', 'fa-edit');
                }
            }
        }, function(reason) {
            elementSaving = false;
            if (reason.type === 'info')
                growl.info(reason.message);
            else if (reason.type === 'warning')
                growl.warning(reason.message);
            else if (reason.type === 'error')
                growl.error(reason.message);
            $rootScope.tbApi.toggleButtonSpinner('element.editor.save');
        });

        $rootScope.tbApi.select('element.editor');
    });

    var savingAll = false;
    $scope.$on('element.editor.saveall', function() {
        if (savingAll) {
            growl.info('Please wait...');
            return;
        }
        if (Object.keys($rootScope.veEdits).length === 0) {
            growl.info('Nothing to save');
            return;
        }
        if ($rootScope.veSpecApi && $rootScope.veSpecApi.tinymceSave)
            $rootScope.veSpecApi.tinymceSave();
        savingAll = true;
        $rootScope.tbApi.toggleButtonSpinner('element.editor.saveall');
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
                growl.success("Save All Successful");
                $rootScope.tbApi.select('element.viewer');
            } else {
                $rootScope.$broadcast('elementSelected', failed);
                growl.error("Some elements failed to save, resolve individually in edit pane");
            }
           $rootScope.tbApi.toggleButtonSpinner('element.editor.saveall');
            savingAll = false;

            if (Object.keys($rootScope.veEdits).length === 0) {
                $rootScope.tbApi.setIcon('element.editor', 'fa-edit');
        }
        });
    });
    $scope.$on('element.editor.cancel', function() {
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
                $rootScope.tbApi.select('element.viewer');
                $rootScope.tbApi.setIcon('element.editor', 'fa-edit');
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
    $scope.$on('view.reorder.save', function() {
        if (viewSaving) {
            growl.info('Please Wait...');
            return;
        }
        viewSaving = true;
        $rootScope.tbApi.toggleButtonSpinner('view.reorder.save');
        $scope.viewOrderApi.save().then(function(data) {
            viewSaving = false;
            growl.success('Save Succesful');
            $rootScope.tbApi.toggleButtonSpinner('view.reorder.save');
        }, function(reason) {
            viewSaving = false;
            if (reason.type === 'info')
                growl.info(reason.message);
            else if (reason.type === 'warning')
                growl.warning(reason.message);
            else if (reason.type === 'error')
                growl.error(reason.message);
            $rootScope.tbApi.toggleButtonSpinner('view.reorder.save');
        });
        $rootScope.tbApi.select('view.reorder');
    });
    $scope.$on('view.reorder.cancel', function() {
        $scope.specApi.setEditing(false);
        $scope.viewOrderApi.revertEdits();
        $rootScope.tbApi.select('element.viewer');
        showPane('element');
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
