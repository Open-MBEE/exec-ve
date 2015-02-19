'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('ToolbarCtrl', ['$scope', '$rootScope', '$timeout', 'UxService',
function($scope, $rootScope, $timeout, UxService) {   

    $scope.tbApi = {};
    $scope.buttons = [];
    $scope.togglePane = {};

    // TODO: Manage rootScope in controllers, for now set/get in one area of the code
    // Set MMS $rootScope variables
    $rootScope.mms_tbApi = $scope.tbApi;

    // Get MMS $rootScope variables
    $scope.togglePane = $rootScope.mms_togglePane;


    // TODO: convert to callback rather than timeout
    $timeout(function() {

      $scope.tbApi.addButton(UxService.getToolbarButton("element.viewer"));
      $scope.tbApi.addButton(UxService.getToolbarButton("element.editor"));

      // TODO: if state is View Editor only
      $scope.tbApi.addButton(UxService.getToolbarButton("view.reorder"));
      $scope.tbApi.addButton(UxService.getToolbarButton("document.snapshot"));

      // TODO: remove this button from UxService not needed anymore
      // $scope.tbApi.addButton(UxService.getToolbarButton("element.editor.mm"));

      $scope.tbApi.addButton(UxService.getToolbarButton("configurations"));

    }, 500);

    $scope.onClick = function(button) {
    };
}])
.controller('TreeCtrl', ['$anchorScroll' , '$filter', '$location', '$modal', '$scope', '$rootScope', '$state', '$stateParams', '$timeout', 'growl', 
                          'UxService', 'ConfigService', 'ElementService', 'UtilsService', 'WorkspaceService', 'ViewService',
                          'workspaces', 'sites', 'document', 'views',
function($anchorScroll, $filter, $location, $modal, $scope, $rootScope, $state, $stateParams, $timeout, growl, 
          UxService, ConfigService, ElementService, UtilsService, WorkspaceService, ViewService,
          workspaces, sites, document, views) {

    $rootScope.mms_bbApi = $scope.bbApi = {};

    $rootScope.mms_treeApi = $scope.treeApi = {};

    $rootScope.mms_treeInitial = '';

    $rootScope.mms_fullDocMode = false;

    $scope.buttons = [];


    // TODO: pull in config/tags
    var time = 'latest';
    var config = time;
    var configSnapshots = null;
    var ws = $stateParams.workspace;

    if (document !== null) {
        $scope.document = document;
        $scope.editable = $scope.document.editable && time === 'latest' && $scope.document.specialization.type === 'Product';
    }

    // TODO: convert to callback rather than timeout
    $timeout(function() {
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.expand"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.collapse"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.filter"));

      if ($state.current.name === 'workspace') {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.task"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.configuration"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.delete"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.merge"));
      } else if ($state.current.name === 'workspace.site') {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.document"));
        $scope.bbApi.setPermission("tree.add.document", config == 'latest' ? true : false);
      } else if ($state.current.name === 'workspace.site.document') {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.delete.view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.reorder.view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.full.document"));
        $scope.bbApi.setPermission("tree.add.view", $scope.editable);
        $scope.bbApi.setPermission("tree.reorder.view", $scope.editable);
        $scope.bbApi.setPermission("tree.delete.view", $scope.editable);
        $scope.bbApi.setTooltip("tree.full.document", $rootScope.mms_fullDocMode ? "View Mode" : "Full Document");
        $scope.bbApi.setIcon("tree.full.document", $rootScope.mms_fullDocMode ? "fa-file-text" : "fa-file-text-o");
      }

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

    $scope.$on('tree.add.task', function() {
        $scope.addItem('Workspace');
    });

    // TODO: Rename button to tag
    $scope.$on('tree.add.configuration', function() {
        $scope.addItem('Tag');
    });

    $scope.$on('tree.add.document', function() {
        $scope.addItem('Document');
    });

    $scope.$on('tree.add.view', function() {
        $scope.addItem('View');
    });

    $scope.$on('tree.delete', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree.delete.view', function() {
        $scope.deleteView();
    });

    $scope.$on('tree.merge', function() {
        $scope.toggleMerge();
    });

    $scope.$on('tree.reorder.view', function() {
        $rootScope.mms_fullDocMode = false;
        $scope.bbApi.setTooltip("tree.full.document", "Full Document");
        $scope.bbApi.setIcon("tree.full.document", 'fa-file-text-o');

        $scope.reorder(); 
    });

    $scope.$on('tree.full.document', function() {
        $scope.fullDocMode();

        $scope.bbApi.setTooltip("tree.full.document", $rootScope.mms_fullDocMode ? "View Mode" : "Full Document");
        $scope.bbApi.setIcon("tree.full.document", $rootScope.mms_fullDocMode ? "fa-file-text" : "fa-file-text-o");
    });


    // TODO: Move toggle to button bar api
    $scope.filterOn = false;
    $scope.toggleFilter = function() {
        $scope.filterOn = !$scope.filterOn;
    };

    // TODO: Move toggle to button bar api
    $scope.mergeOn = false;
    $scope.toggleMerge = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Compare Error: Select task or tag to compare from");
            return;
        }
        var parent_branch = $scope.treeApi.get_parent_branch(branch);
        while (parent_branch.type != 'Workspace') {
            parent_branch = $scope.treeApi.get_parent_branch(parent_branch);
        }

        $scope.mergeOn = !$scope.mergeOn;
        $scope.mergeFrom = branch;
        $scope.mergeTo = parent_branch;
    };

    $scope.pickNew = function(source, branch) {
        if (!branch) {
            growl.warning("Select new task or tag to compare");
            return;
        }
        if (source == 'from')
            $scope.mergeFrom = branch;
        if (source == 'to')
            $scope.mergeTo = branch;
    };

    // TODO: Move toggle to button bar api
    $scope.comparing = false;
    $scope.compare = function() {
        if ($scope.comparing) {
            growl.info("Please wait...");
            return;
        }
        if (!$scope.mergeFrom || !$scope.mergeTo) {
            growl.warning("From and To fields must be filled in");
            return;
        }
        var sourceWs = $scope.mergeFrom.data.id;
        var sourceTime = 'latest';
        if ($scope.mergeFrom.type === 'Configuration') {
            sourceWs = $scope.mergeFrom.workspace;
            sourceTime = $scope.mergeFrom.data.timestamp;
        }
        var targetWs = $scope.mergeTo.data.id;
        var targetTime = 'latest';
        if ($scope.mergeTo.type === 'Configuration') {
            targetWs = $scope.mergeTo.workspace;
            targetTime = $scope.mergeTo.data.timestamp;
        }
        $scope.comparing = true;
        $state.go('mm.diff', {source: sourceWs, target: targetWs, sourceTime: sourceTime, targetTime: targetTime});
    };
 
    // TODO: Make this section generic
    var workspaceLevel2Func = function(workspaceId, workspaceTreeNode) {
        ConfigService.getConfigs(workspaceId).then (function (data) {
            data.forEach(function (config) {
                var configTreeNode = { 
                    label : config.name, 
                    type : "Configuration",
                    data : config, 
                    workspace: workspaceId,
                    children : [] 
                };

                // check all the children of the workspace to see if any tasks match the timestamp of the config
                // if so add the workspace as a child of the configiration it was tasked from
                for (var i = 0; i < workspaceTreeNode.children.length; i++) {
                    var childWorkspaceTreeNode = workspaceTreeNode.children[i];
                    if (childWorkspaceTreeNode.type === 'Workspace') {
                        if (childWorkspaceTreeNode.data.branched === config.timestamp) {
                            configTreeNode.children.push(childWorkspaceTreeNode);
                            
                            workspaceTreeNode.children.splice(i, 1);
                            i--;
                        }
                    }
                }

                workspaceTreeNode.children.unshift(configTreeNode); 
            });
            if ($scope.treeApi.refresh)
                $scope.treeApi.refresh();
        });
    };

    var siteLevel2Func = function(site, siteNode) {
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

    var dataTree;
    if ($state.current.name === 'workspace') {
        dataTree = UtilsService.buildTreeHierarchy(workspaces, "id", "Workspace", "parent", workspaceLevel2Func);
        $scope.my_data = dataTree;
    } else if ($state.current.name === 'workspace.site') {
        dataTree = UtilsService.buildTreeHierarchy(sites, "sysmlid", "site", "parent", siteLevel2Func);
        $scope.my_data = dataTree;
    } else
    {
        // this is from view editor
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

        var seenChild = {};
        if (!document.specialization.view2view) {
            document.specialization.view2view = [{id: document.sysmlid, childrenViews: []}];
        }
        document.specialization.view2view.forEach(function(view) {
            var viewid = view.id;
            view.childrenViews.forEach(function(childId) {
                if (seenChild[childId]) {
                    growl.error("You have a view called " + seenChild[childId].label + " that's a child of multiple parents! Please fix in the model.");
                    return;
                }
                viewId2node[viewid].children.push(viewId2node[childId]);
                seenChild[childId] = viewId2node[childId];
            });
        });
        $scope.my_data = [viewId2node[document.sysmlid]];
    }

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
    // TODO: Update behavior to handle new state descriptions
    $scope.my_tree_handler = function(branch) {
        if (branch.type === 'Workspace')
            $state.go('mm.workspace', {ws: branch.data.id});
        else if (branch.type === 'Configuration')
            $state.go('mm.workspace.config', {ws: branch.workspace, config: branch.data.id});
        else if (branch.type === 'site') {
            $state.go('portal.site', {site: branch.data.sysmlid});
        } else if (branch.type === 'view' || branch.type === 'snapshot') {
            // TODO: remove this   ---   is it really needed? $rootScope.portalDocBranch = branch;
            $state.go('portal.site.view', {site: branch.site, docid: branch.data.sysmlid});
        } else {
            // this is from the view editor 
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
        }

        $rootScope.tbApi.select('element.viewer');

    };

    // TODO: Update sort function to handle all cases
    var sortFunction = function(a, b) {

        a.priority = 100;
        if (a.type === 'Configuration') {
            a.priority = 0 ;
        } else if (a.type === 'View') {
            a.priority = 1;
        }

        b.priority = 100;
        if (b.type === 'Configuration') {
            b.priority = 0 ;
        } else if (a.type === 'view') {
            a.priority = 1;
        }

        if(a.priority < b.priority) return -1;
        if(a.priority > b.priority) return 1;

        if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
        if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;

        return 0;
    };

    // TODO: update tree options to call from UxService
    $scope.tree_options = {
        types: UxService.getTreeTypes(),
        sort: sortFunction
    };
    
    // TODO: this is a hack, need to resolve in alternate way    
    $timeout(function() {
        $scope.treeApi.refresh();
    }, 5000);
    

    $scope.addItem = function(itemType) {

      // TODO: Merge functions for adding, make generic, hack for now
      if (itemType === 'Workspace') {
        $scope.addWorkspace();        
      } else if (itemType === 'Tag') {
        $scope.addConfiguration();
      }

    };

    $scope.fullDocMode = function() {
        if ($rootScope.veFullDocMode) {
            $rootScope.veFullDocMode = false;
            $scope.bbApi.setTooltip("tree.full.document", "Full Document");
            $scope.bbApi.setIcon("tree.full.document", 'fa-file-text-o');
            var curBranch = $scope.treeApi.get_selected_branch();
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

        var branch = $scope.treeApi.get_selected_branch();
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
              $scope.treeApi.add_branch(branch, {
                  label: data.name,
                  type: "view",
                  data: data,
                  children: []
              });
              
              $state.go('doc.view', {viewId: data.sysmlid});

            });

        }, function(reason) {
            growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
        });
    };

    // TODO: merge with addItem and remove
    $scope.addWorkspace = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Add Task Error: Select a task or tag first");
            return;
        }
        if (branch.type === 'Configuration') {
            $scope.createWsParentId = branch.workspace;
            $scope.createWsTime = branch.data.timestamp;
            $scope.from = 'Tag ' + branch.data.name;
        } else {
            $scope.createWsParentId = branch.data.id;
            $scope.createWsTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss.sssZ');
            $scope.from = 'Task ' + branch.data.name;
        }
        var instance = $modal.open({
            templateUrl: 'partials/mm/new.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', workspaceCtrl]
        });
        instance.result.then(function(data) {
            var newbranch = {
                label: data.name,
                type: "Workspace",
                data: data,
                children: []
            };
            
            // Want to see branches under tags now, commenting this out
            /// if (branch.type === 'Configuration') {
            ///    treeApi.add_branch(treeApi.get_parent_branch(branch), newbranch);
            /// } else {
            ///     treeApi.add_branch(branch, newbranch);
            /// }
            $scope.treeApi.add_branch(branch, newbranch);
        });
    };

    // TODO: merge with addItem and remove
    $scope.addConfiguration = function() {

        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Add Tag Error: Select parent task first");
            return;
        } else if (branch.type != "Workspace") {
            growl.warning("Add Tag Error: Selection must be a task");
            return;
        }

        $scope.createConfigParentId = branch.data.id;
        $scope.configuration = {};
        $scope.configuration.now = true;

        var instance = $modal.open({
            templateUrl: 'partials/mm/new-configuration.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', '$filter', configurationCtrl]
        });
        instance.result.then(function(data) {
          $scope.treeApi.add_branch(branch, {
              label: data.name,
              type: "Configuration",
              workspace: branch.data.id,
              data: data,
              children: []
          }, true);
        });
    };


    $scope.deleteItem = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }

        // TODO: do not pass selected branch in scope, move page to generic location
        $scope.deleteBranch = branch;
        var instance = $modal.open({
            templateUrl: 'partials/mm/delete.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', deleteCtrl]
        });
        instance.result.then(function(data) {
            // If the deleted item is a configration, then all of its child workspaces
            // are re-associated with the parent task of the configuration
            if (branch.type === 'Configuration') {
                var parentWsBranch = $scope.treeApi.get_parent_branch(branch);
                branch.children.forEach(function(branchChild) {
                    parentWsBranch.children.push(branchChild);
                });
            }
            $scope.treeApi.remove_branch(branch);
        });
    };

    $scope.deleteView = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }

        if (branch.type != 'view' || (branch.data.specialization && branch.data.specialization.type != 'View')) {
            growl.warning("Delete Error: Selected item is not a view.");
            return;
        }

        $scope.deleteBranch = branch;
        var instance = $modal.open({
            templateUrl: 'partials/ve/delete.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', deleteCtrl]
        });
        instance.result.then(function(data) {
            $scope.treeApi.remove_branch(branch);
        });
    };

    // TODO: Make this a generic delete controller
    var deleteCtrl = function($scope, $modalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        $scope.type = branch.type === 'Workspace' ? 'Task' : 'Tag';
        $scope.name = branch.data.name;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            if (branch.type === "Workspace") {
                WorkspaceService.deleteWorkspace(branch.data.id)
                .then(function(data) {
                    growl.success("Task Deleted");
                    $modalInstance.close('ok');
                }, function(reason) {
                    growl.error("Task Delete Error: " + reason.message);
                }).finally(function() {
                    $scope.oking = false;
                });
            } else if (branch.type === "Configuration") {
                ConfigService.deleteConfig(branch.data.id)
                .then(function(data) {
                    growl.success("Tag Deleted");
                    $modalInstance.close('ok');
                }, function(reason) {
                    growl.error("Tag Delete Error: " + reason.message);
                }).finally(function() {
                    $scope.oking = false;
                });
            } 
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };


    // TODO: Make this a generic delete controller
    var deleteViewCtrl = function($scope, $modalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        $scope.type = 'View';
        $scope.name = branch.data.name;
        var product = $scope.document;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;

            for (var i = 0; i < product.specialization.view2view.length; i++) {
                var view = product.specialization.view2view[i];
                if (branch.data.sysmlid === view.id ) {
                    // remove 
                    product.specialization.view2view.splice(i,1);
                    i--;
                }
                for (var j = 0; j < view.childrenViews.length; j++) {
                    var childViewId = view.childrenViews[j];
                    if (branch.data.sysmlid === childViewId) {
                        // remove child view
                        view.childrenViews.splice(j,1);
                        j--;
                    }
                }
            }

            /*product.specialization.view2view.forEach(function(view) {
                var viewId = view.id;
                view.childrenViews.forEach(function(childId) {
                    viewIds2node[viewId].children.push(viewIds2node[childId]);
                });
            }); */

            ViewService.updateDocument(product, ws)
            .then(function(data) {
                growl.success("View Deleted");
                $modalInstance.close('ok');
            }, function(reason) {
                growl.error("View Delete Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });

        }; 
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    // TODO: Make this a generic add controller
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

    // TODO: Make this a generic add controller, merge with workspaceCtrl
    var configurationCtrl = function($scope, $modalInstance, $filter) {
        $scope.configuration = {};
        $scope.configuration.name = "";
        $scope.configuration.description = "";
        $scope.configuration.now = "true";
        $scope.configuration.timestamp = new Date();
        $scope.oking = false;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var config = {"name": $scope.configuration.name, "description": $scope.configuration.description};

            if ($scope.configuration.now === "false") {
                config.timestamp = $filter('date')($scope.configuration.timestamp, 'yyyy-MM-ddTHH:mm:ss.sssZ');
            }

            ConfigService.createConfig(config, $scope.createConfigParentId)
            .then(function(data) {
                growl.success("Tag Created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Tag Error: " + reason.message);
            }).finally(function(){
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    // TODO: Make this a generic add controller, merge with configurationCtrl
    var workspaceCtrl = function($scope, $modalInstance) {
        $scope.workspace = {};
        $scope.workspace.name = "";
        $scope.workspace.description = "";
        $scope.oking = false;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var workspaceObj = {"name": $scope.workspace.name, "description": $scope.workspace.description};
            workspaceObj.parent = $scope.createWsParentId;
            workspaceObj.branched = $scope.createWsTime;

            WorkspaceService.create(workspaceObj)
            .then(function(data) {
                growl.success("Task Created");
                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Task Error: " + reason.message);
            }).finally(function(){
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    // TODO: Make this a generic add controller
    var viewCtrl = function($scope, $modalInstance) {
        $scope.newView = {};
        $scope.newView.name = "";
        $scope.oking = false;
            
        $scope.search = function(searchText) {
            //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
            //growl.info("Searching...");
            $scope.searchClass = "fa fa-spin fa-spinner";

            ElementService.search(searchText, false, ws)
            .then(function(data) {

                for (var i = 0; i < data.length; i++) {
                    if (data[i].specialization.type != 'View') {
                        data.splice(i, 1);
                        i--;
                    }
                }

                $scope.mmsCfElements = data;
                $scope.searchClass = "";
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
                $scope.searchClass = "";
            });
        };

        $scope.addView = function(viewId) {
            var documentId = $scope.document.sysmlid;
            var workspace = ws;

            var branch = $scope.treeApi.get_selected_branch();
            var parentViewId = branch.data.sysmlid;

            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;  

            ViewService.getView(viewId, false, workspace)
            .then(function (data) {
                
                var viewOb = data;

                ViewService.addViewToDocument(viewId, documentId, parentViewId, workspace, viewOb)
                .then(function(data) {
                    growl.success("View Added");
                    $modalInstance.close(viewOb);
                }, function(reason) {
                    growl.error("View Add Error: " + reason.message);
                }).finally(function() {
                    $scope.oking = false;
                }); 

            }, function(reason) {
                growl.error("View Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });             
        };

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

    function addViewSections(view) {
        var node = viewId2node[view.sysmlid];
        addSectionElements(view, node, node);
        $scope.treeApi.refresh();
    }
    if ($state.current.name === 'workspace.site.document') {
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
    }

}]);