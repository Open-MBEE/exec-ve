'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('TreeCtrl', ['$anchorScroll' , '$q', '$filter', '$location', '$modal', '$scope', '$rootScope', '$state', '$stateParams', '$timeout', 'growl', 
                          'UxService', 'ConfigService', 'ElementService', 'UtilsService', 'WorkspaceService', 'ViewService',
                          'workspaces', 'workspaceObj', 'tag', 'sites', 'site', 'document', 'views', 'view', 'time', 'configSnapshots', 'docFilter',
function($anchorScroll, $q, $filter, $location, $modal, $scope, $rootScope, $state, $stateParams, $timeout, growl, UxService, ConfigService, ElementService, UtilsService, WorkspaceService, ViewService, workspaces, workspaceObj, tag, sites, site, document, views, view, time, configSnapshots, docFilter) {

    $rootScope.mms_bbApi = $scope.bbApi = {};
    $rootScope.mms_treeApi = $scope.treeApi = {};
    $scope.buttons = [];
    $scope.treeExpandLevel = 1;
    $scope.treeSectionNumbering = false;
    if ($state.includes('workspace.site.document')) {
        $scope.treeSectionNumbering = true;
        $scope.treeExpandLevel = 3;
    }
    $rootScope.mms_fullDocMode = false;
    if ($state.includes('workspace.site.document.full'))
        $rootScope.mms_fullDocMode = true;

    // TODO: pull in config/tags
    var config = time;
    var ws = $stateParams.workspace; // TODO this is undefined, but is being used below

    if (document !== null) {
        $scope.document = document;
        $scope.editable = $scope.document.editable && time === 'latest' && $scope.document.specialization.type === 'Product';
    }

    // If it is not the master workspace, then retrieve it:
    if (workspaceObj.id !== 'master') {
        WorkspaceService.getWorkspace('master').then(function (data) {
            $scope.wsPerms = data.workspaceOperationsPermission;
        });
    }
    else {
        $scope.wsPerms = workspaceObj.workspaceOperationsPermission;
    }

    $scope.bbApi.init = function() {
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.expand"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.collapse"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree.filter"));

      if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.task"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.configuration"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.delete"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.merge"));
        $scope.bbApi.setPermission("tree.add.task", $scope.wsPerms);
        $scope.bbApi.setPermission("tree.delete", $scope.wsPerms);
        $scope.bbApi.setPermission("tree.merge", $scope.wsPerms);
      } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.document"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.showall.sites"));
        $scope.bbApi.setPermission("tree.add.document", config == 'latest' ? true : false);
      } else if ($state.includes('workspace.site.document')) {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.add.view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.delete.view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.reorder.view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree.full.document"));
        $scope.bbApi.setPermission("tree.add.view", $scope.editable);
        $scope.bbApi.setPermission("tree.reorder.view", $scope.editable);
        $scope.bbApi.setPermission("tree.delete.view", $scope.editable);
        if ($rootScope.mms_fullDocMode)
            $scope.bbApi.setToggleState('tree.full.document', true);
      }
    };

    $scope.$on('tree.expand', function() {
        $scope.treeApi.expand_all();
    });

    $scope.$on('tree.collapse', function() {
        $scope.treeApi.collapse_all();
    });

    $scope.$on('tree.filter', function() {
        $scope.toggleFilter();
    });

    $scope.$on('tree.showall.sites', function() {
        $scope.toggleShowAllSites();
    });

    $scope.$on('tree.add.task', function() {
        $scope.addItem('Workspace');
    });

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
        $scope.deleteItem();
    });

    $scope.$on('tree.merge', function() {
        $scope.toggleMerge();
    });

    $scope.$on('tree.reorder.view', function() {
        $rootScope.mms_fullDocMode = false;
        $scope.bbApi.setToggleState("tree.full.document", false);
        $state.go('workspace.site.document.order');
    });

    var creatingSnapshot = false;
    $scope.$on('document.snapshot.create', function() {
        if (creatingSnapshot) {
            growl.info('Please Wait...');
            return;
        }
        creatingSnapshot = true;
        $rootScope.mms_tbApi.toggleButtonSpinner('document.snapshot.create');

        $scope.itemType = 'Tag';
        $scope.createConfigParentId = workspaceObj.id;
        $scope.configuration = {};
        $scope.configuration.now = true;
        var templateUrlStr = 'partials/mms/new-tag.html';
        var branchType = 'configuration';

        var instance = $modal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$modalInstance', '$filter', addItemCtrl]
        });
        instance.result.then(function(data) {

        }, function(reason) {
            growl.error("Snapshot Creation failed: " + reason.message);
        }).finally(function() {
            creatingSnapshot = false;
            $rootScope.mms_tbApi.toggleButtonSpinner('document.snapshot.create');
        });

        $rootScope.mms_tbApi.select('document.snapshot');

    });

    /* var refreshSnapshots = function() {
        $rootScope.mms_tbApi.toggleButtonSpinner('document.snapshot.refresh');
        ConfigService.getProductSnapshots(document.sysmlid, site.sysmlid, workspaceObj.id, true)
        .then(function(result) {
            $scope.snapshots = result;
        }, function(reason) {
            growl.error("Refresh Failed: " + reason.message);
        })
        .finally(function() {
            $rootScope.mms_tbApi.toggleButtonSpinner('document.snapshot.refresh');
            $rootScope.mms_tbApi.select('document.snapshot');

        });
    };

    $scope.$on('document.snapshot.refresh', refreshSnapshots); */

    $scope.$on('tree.full.document', function() {
        $scope.fullDocMode();
    });

    $scope.toggleFilter = function() {
        $scope.bbApi.toggleButtonState('tree.filter');
    };

    $scope.toggleShowAllSites = function() {
        $scope.bbApi.toggleButtonState('tree.showall.sites');
        $scope.my_data = UtilsService.buildTreeHierarchy(filter_sites(sites), "sysmlid", "site", "parent", siteLevel2Func);
        $scope.mms_treeApi.clear_selected_branch();
    };

    // TODO: Move toggle to button bar api
    $scope.mergeOn = false;
    $scope.toggleMerge = function() {
        var branch = $scope.mms_treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Compare Error: Select task or tag to compare from");
            return;
        }
        var parent_branch = $scope.mms_treeApi.get_parent_branch(branch);
        while (parent_branch.type != 'workspace') {
            parent_branch = $scope.mms_treeApi.get_parent_branch(parent_branch);
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
        if ($scope.mergeFrom.type === 'configuration') {
            sourceWs = $scope.mergeFrom.workspace;
            sourceTime = $scope.mergeFrom.data.timestamp;
        }
        var targetWs = $scope.mergeTo.data.id;
        var targetTime = 'latest';
        if ($scope.mergeTo.type === 'configuration') {
            targetWs = $scope.mergeTo.workspace;
            targetTime = $scope.mergeTo.data.timestamp;
        }
        $scope.comparing = true;
        $state.go('workspace.diff', {source: sourceWs, target: targetWs, sourceTime: sourceTime, targetTime: targetTime});
    };

    // Filter out alfresco sites
    var filter_sites = function(site_array) {
        var ret_array = [];

        if ($scope.bbApi.getToggleState && $scope.bbApi.getToggleState('tree.showall.sites')) {
            ret_array = site_array;
        }
        else {
            for (var i=0; i < site_array.length; i++) {
                var obj = site_array[i];
                // If it is a site characterization:
                if (obj.isCharacterization) {
                    ret_array.push(obj);
                }
            }
        }
        return ret_array;
    };
 
    // TODO: Make this section generic
    var workspaceLevel2Func = function(workspaceId, workspaceTreeNode) {
        workspaceTreeNode.loading = true;
        ConfigService.getConfigs(workspaceId).then (function (data) {
            data.forEach(function (config) {
                var configTreeNode = { 
                    label : config.name, 
                    type : "configuration",
                    data : config, 
                    workspace: workspaceId,
                    children : [] 
                };

                // check all the children of the workspace to see if any tasks match the timestamp of the config
                // if so add the workspace as a child of the configiration it was tasked from
                for (var i = 0; i < workspaceTreeNode.children.length; i++) {
                    var childWorkspaceTreeNode = workspaceTreeNode.children[i];
                    if (childWorkspaceTreeNode.type === 'workspace') {
                        if (childWorkspaceTreeNode.data.branched === config.timestamp) {
                            configTreeNode.children.push(childWorkspaceTreeNode);
                            
                            workspaceTreeNode.children.splice(i, 1);
                            i--;
                        }
                    }
                }

                workspaceTreeNode.children.unshift(configTreeNode); 
            });
            workspaceTreeNode.loading = false;
            if ($scope.treeApi.refresh)
                $scope.treeApi.refresh();
        }, function(reason) {
            growl.error(reason.message);
        });
    };

    var siteLevel2Func = function(site, siteNode, onlyTopLevel) {
        
        // Setting all sites to be expandable
        siteNode.expandable = true;
        
        // String relating to the proper callback as defined in the directive
        siteNode.expandCallback = 'siteLevel2Func';
        
        // Whether to load only top-level documents
        onlyTopLevel = typeof onlyTopLevel !== 'undefined' ? onlyTopLevel : true;
        
        // Skip if not a top-level node
        if(onlyTopLevel && (siteNode.level !== 1 || siteNode.data.isCharacterization !== true)) return;
        
        // Make sure we haven't already loaded the docs for this site
        if(siteNode.docsLoaded) return;
        // Set docs loaded attribute
        siteNode.docsLoaded = true;
        
        siteNode.loading = true;
        ViewService.getSiteDocuments(site, false, ws, config === 'latest' ? 'latest' : tag.timestamp)
        .then(function(docs) {
	        
	        // If no documents are found on a site, stop forcing expansion
	        if(docs.length === 0) siteNode.expandable = false;
	        
            var filteredDocs = {};
            if (docFilter)
                filteredDocs = JSON.parse(docFilter.documentation);
            
                if (config === 'latest') {
                    docs.forEach(function(doc) {
                        if (filteredDocs[doc.sysmlid])
                            return;
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
                        if (filteredDocs[doc.sysmlid])
                            return;
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
                siteNode.loading = false;
                if ($scope.treeApi.refresh)
                    $scope.treeApi.refresh();
        }, function(reason) {
            growl.error(reason.message);
        });
    };
    
    $scope.siteLevel2Func = siteLevel2Func;

    if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
        $scope.my_data = UtilsService.buildTreeHierarchy(workspaces, "id", 
                                                         "workspace", "parent", workspaceLevel2Func);
    } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
        $scope.my_data = UtilsService.buildTreeHierarchy(filter_sites(sites), "sysmlid", "site", "parent", siteLevel2Func);
    } else
    {
        // this is from view editor
        var viewId2node = {};
        viewId2node[document.sysmlid] = {
            label: document.name,
            type: 'view',
            data: document,
            children: [],
            loading: true
        };
        views.forEach(function(view) {
            var viewTreeNode = { 
                label : view.name, 
                type : "view",
                data : view, 
                children : [], 
                loading: true
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
                if (!viewId2node[childId]) {
                    growl.error("View " + childId + " not found.");
                    return;
                }
                if (!viewId2node[viewid]) {
                    growl.error("View " + viewid + " not found.");
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
        var contents = null;

        var addContainsSectionTreeNode = function(containedElement) {
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
        };

        var addContentsSectionTreeNode = function(operand) {
            var instances = [];
            operand.forEach(function(instanceVal) {
                instances.push(ViewService.parseExprRefTree(instanceVal, $scope.workspace, time));
            });
            $q.all(instances).then(function(results) {
                var k = results.length - 1;
                for (; k >= 0; k--) {
                    var instance = results[k];
                    if (ViewService.isSection(instance)) {
                        var sectionTreeNode = {
                            label : instance.name,
                            type : "section",
                            view : viewNode.data.sysmlid,
                            data : instance,
                            children: []
                        };
                        parentNode.children.unshift(sectionTreeNode);
                        addSectionElements(instance, viewNode, sectionTreeNode);
                    }
                }
                $scope.treeApi.refresh();
            }, function(reason) {
                //view is bad
            });
           /*ViewService.parseExprRefTree(instanceVal, $scope.workspace)
           .then(function(containedElement) {
               if (ViewService.isSection(containedElement)) {
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
            });*/
        };

        if (element.specialization) {
          
            if (element.specialization.contents) {
                contents = element.specialization.contents;
            }
            // For Sections, the contents expression is the instanceSpecificationSpecification:
            else if (ViewService.isSection(element) &&
                     element.specialization.instanceSpecificationSpecification) {
                contents = element.specialization.instanceSpecificationSpecification;
            }
            else if (element.specialization.contains) {
                contains = element.specialization.contains;
            }
        }
        /*else {

            if (element.contents) {
                contents = element.contents;
            }
            else if (element.contains) {
                contains = element.contains;
            }
        }*/

        var j;
        if (contains) {
            j = contains.length - 1;
            for (; j >= 0; j--) {
                addContainsSectionTreeNode(contains[j]);
            }
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode(contents.operand);
            /*j = contents.operand.length - 1;
            for (; j >= 0; j--) {
                addContentsSectionTreeNode(contents.operand[j]);
            }*/
        }
    }
    // TODO: Update behavior to handle new state descriptions
    $scope.my_tree_handler = function(branch) {
        if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
            if (branch.type === 'workspace') {
                $state.go('workspace', {workspace: branch.data.id, tag: undefined});
            } else if (branch.type === 'configuration') {
                //$rootScope.$broadcast('elementSelected', branch.data.id, 'tag');
                $state.go('workspace', {workspace: branch.workspace, tag: branch.data.id});
            }
        } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
            if (branch.type === 'site')
                $state.go('workspace.site', {site: branch.data.sysmlid});
            else if (branch.type === 'view' || branch.type === 'snapshot') {
                var documentSiteBranch = $rootScope.mms_treeApi.get_parent_branch(branch);
                $state.go('workspace.site.documentpreview', {site: documentSiteBranch.data.sysmlid, document: branch.data.sysmlid});
            }
        } else if ($state.includes('workspace.site.document')) {

            var view = branch.type === 'section' ? branch.view : branch.data.sysmlid;
            var sectionId = branch.type === 'section' ? branch.data.sysmlid : null;
            var hash = sectionId ? sectionId : view;
            if ($rootScope.mms_fullDocMode) {
                $location.hash(hash);
                $rootScope.veCurrentView = view;
                ViewService.setCurrentViewId(view);
                $anchorScroll();
            } else if (branch.type === 'view') {
                $state.go('workspace.site.document.view', {view: branch.data.sysmlid});
            } else if (branch.type === 'section') {
                $state.go('workspace.site.document.view', {view: view});
                $timeout(function() {
                    $location.hash(hash);
                    $anchorScroll();
                }, 1000);
            }
        }
        $rootScope.mms_tbApi.select('element.viewer');
    };

    // TODO: Update sort function to handle all cases
    var sortFunction = function(a, b) {

        a.priority = 100;
        if (a.type === 'configuration') {
            a.priority = 0 ;
        } else if (a.type === 'site') {
            a.priority = 1;
        }
         else if (a.type === 'view') {
            a.priority = 2;
        }

        b.priority = 100;
        if (b.type === 'configuration') {
            b.priority = 0 ;
        } else if (b.type === 'site') {
            b.priority = 1;
        }
         else if (b.type === 'view') {
            b.priority = 2;
        }

        if(a.priority < b.priority) return -1;
        if(a.priority > b.priority) return 1;
        if (!a.label)
            a.label = '';
        if (!b.label)
            b.label = '';
        if(a.label.toLowerCase() < b.label.toLowerCase()) return -1;
        if(a.label.toLowerCase() > b.label.toLowerCase()) return 1;

        return 0;
    };

    // TODO: update tree options to call from UxService
    $scope.tree_options = {
        types: UxService.getTreeTypes(),
        siteLevel2Func: siteLevel2Func
    };
    if (!$state.includes('workspace.site.document'))
        $scope.tree_options.sort = sortFunction;
    
    // TODO: this is a hack, need to resolve in alternate way    
    $timeout(function() {
        $scope.treeApi.refresh();
    }, 5000);
    

    $scope.addItem = function(itemType) {

        // TODO: combine templateUrlStr into one .html

        $scope.itemType = itemType;
        var branch = $scope.treeApi.get_selected_branch();
        var templateUrlStr = "";
        var branchType = "";

        // Adds the branch:
        var myAddBranch = function() {
            var instance = $modal.open({
                templateUrl: templateUrlStr,
                scope: $scope,
                controller: ['$scope', '$modalInstance', '$filter', addItemCtrl]
            });
            instance.result.then(function(data) {
                var newbranch = {
                    label: data.name,
                    type: branchType,
                    data: data,
                    children: [],
                };
                
                var top = false;
                if (itemType === 'Tag') {
                    newbranch.workspace = branch.data.id;
                    top = true;
                }
                else if (itemType === 'Document') {
                    newbranch.site = branch.data.sysmlid;
                }

                $scope.treeApi.add_branch(branch, newbranch, top);

                if (itemType === 'View') {
                    viewId2node[data.sysmlid] = newbranch;
                    $state.go('workspace.site.document.view', {view: data.sysmlid});
                }

            });
        };

        // Item specific setup:
        if (itemType === 'Workspace') {
            if (!branch) {
                growl.warning("Add Task Error: Select a task or tag first");
                return;
            }
            if (branch.type === 'configuration') {
                $scope.createWsParentId = branch.workspace;
                $scope.createWsTime = branch.data.timestamp;
                $scope.from = 'Tag ' + branch.data.name;
            } else {
                $scope.createWsParentId = branch.data.id;
                $scope.createWsTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss.sssZ');
                $scope.from = 'Task ' + branch.data.name;
            }
            templateUrlStr = 'partials/mms/new-task.html';
            branchType = 'workspace';
        }
        else if (itemType === 'Tag') {
            if (!branch) {
                growl.warning("Add Tag Error: Select parent task first");
                return;
            } else if (branch.type != "workspace") {
                growl.warning("Add Tag Error: Selection must be a task");
                return;
            }
            $scope.createConfigParentId = branch.data.id;
            $scope.configuration = {};
            $scope.configuration.now = true;
            templateUrlStr = 'partials/mms/new-tag.html';
            branchType = 'configuration';
        } 
        else if (itemType === 'Document') {
            if (!branch || branch.type !== 'site') {
                growl.warning("Select a site to add document under");
                return;
            }
            $scope.addDocSite = branch.data.sysmlid;
            templateUrlStr = 'partials/mms/new-doc.html';
            branchType = 'view';
        } 
        else if (itemType === 'View') {
            if (!branch) {
                growl.warning("Add View Error: Select parent view first");
                return;
            } else if (branch.type === "section") {
                growl.warning("Add View Error: Cannot add a child view to a section");
                return;
            }
            templateUrlStr = 'partials/mms/new-view.html';
            branchType = 'view';

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

                myAddBranch();

            }, function(reason) {
                growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
            });
        } 
        else {
            growl.error("Add Item of Type " + itemType + " is not supported");
        }

        if (itemType !== 'View') {
            myAddBranch();
        }
    };

    $scope.fullDocMode = function() {
        if ($rootScope.mms_fullDocMode) {
            $rootScope.mms_fullDocMode = false;
            $scope.bbApi.setToggleState("tree.full.document", false);
            var curBranch = $scope.treeApi.get_selected_branch();
            if (curBranch) {
                var viewId;
                if (curBranch.type == 'section')
                    viewId = curBranch.view;
                else
                    viewId = curBranch.data.sysmlid;
                $state.go('workspace.site.document.view', {view: viewId});
            }
        } else {
            if ($state.current.name === 'doc.all') {
                $rootScope.mms_fullDocMode = true;
                $scope.bbApi.setToggleState("tree.full.document", true);
            } else {
                if (document.specialization.view2view.length > 30) {
                    var instance = $modal.open({
                        templateUrl: 'partials/mms/fullDocWarn.html',
                        controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
                            $scope.ok = function() {$modalInstance.close('ok');};
                            $scope.cancel = function() {$modalInstance.close('cancel');};
                        }],
                        size: 'sm'
                    });
                    instance.result.then(function(choice) {
                        if (choice === 'ok') {
                            $rootScope.mms_fullDocMode = true;
                            $scope.bbApi.setToggleState("tree.full.document", true);
                            $state.go('workspace.site.document.full'); 
                        }
                    });
                } else {
                    $rootScope.mms_fullDocMode = true;
                    $scope.bbApi.setToggleState("tree.full.document", true);
                    $state.go('workspace.site.document.full'); 
                }
            }
        }
    };

    $scope.deleteItem = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }
        if ($state.includes('workspace.site.document') && 
            (branch.type !== 'view' || (branch.data.specialization && branch.data.specialization.type != 'View'))) {
            growl.warning("Delete Error: Selected item is not a view.");
            return;
        }
        // TODO: do not pass selected branch in scope, move page to generic location
        $scope.deleteBranch = branch;
        var instance = $modal.open({
            templateUrl: 'partials/mms/delete.html',
            scope: $scope,
            controller: ['$scope', '$modalInstance', deleteCtrl]
        });
        instance.result.then(function(data) {
            // If the deleted item is a configration, then all of its child workspaces
            // are re-associated with the parent task of the configuration
            if (branch.type === 'configuration') {
                var parentWsBranch = $scope.treeApi.get_parent_branch(branch);
                branch.children.forEach(function(branchChild) {
                    parentWsBranch.children.push(branchChild);
                });
            }
            $scope.treeApi.remove_branch(branch);
            $state.go('^');
        });
    };

    // TODO: Make this a generic delete controller
    var deleteCtrl = function($scope, $modalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        if (branch.type === 'workspace')
            $scope.type = 'Task';
        if (branch.type === 'configuration')
            $scope.type = 'Tag';
        if (branch.type === 'view')
            $scope.type = 'View';
        //$scope.type = branch.type === 'workspace' ? 'task' : 'tag';
        $scope.name = branch.data.name;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise = null;
            if (branch.type === "workspace") {
                promise = WorkspaceService.deleteWorkspace(branch.data.id);
            } else if (branch.type === "configuration") {
                promise = ConfigService.deleteConfig(branch.data.id);
            } else if (branch.type === 'view') {
                var product = $scope.document;
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
                promise = ViewService.updateDocument(product, ws);
            }
            promise.then(function(data) {
                growl.success($scope.type + " Deleted");
                $modalInstance.close('ok');
            }, function(reason) {
                growl.error($scope.type + ' Delete Error: ' + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $modalInstance.dismiss();
        };
    };

    // Generic add controller    
    var addItemCtrl = function($scope, $modalInstance, $filter) {

        $scope.oking = false;
        var displayName = "";

        // Item specific setup:
        if ($scope.itemType === 'Workspace') {
            $scope.workspace = {};
            $scope.workspace.name = "";
            $scope.workspace.description = "";
            $scope.workspace.permission = "read";
            displayName = "Task";
        }
        else if ($scope.itemType === 'Tag') {
            $scope.configuration = {};
            $scope.configuration.name = "";
            $scope.configuration.description = "";
            $scope.configuration.now = "true";
            $scope.configuration.timestamp = new Date();
            displayName = "Tag";
        }
        else if ($scope.itemType === 'Document') {
            $scope.doc = {name: ""};
            displayName = "Document";
        }
        else if ($scope.itemType === 'View') {
            $scope.newView = {};
            $scope.newView.name = "";
            displayName = "View";
        }
        else {
            growl.error("Add Item of Type " + $scope.itemType + " is not supported");
            return;
        }
        $scope.searching = false;
        $scope.search = function(searchText) {
            //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
            //growl.info("Searching...");
            $scope.searching = true;

            ElementService.search(searchText, ['name'], null, false, ws)
            .then(function(data) {

                for (var i = 0; i < data.length; i++) {
                    if (data[i].specialization.type != 'View') {
                        data.splice(i, 1);
                        i--;
                    }
                }

                $scope.mmsCfElements = data;
                $scope.searching = false;
            }, function(reason) {
                growl.error("Search Error: " + reason.message);
                $scope.searching = false;
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
            var promise;

            // Item specific promise:
            if ($scope.itemType === 'Workspace') {
                var workspaceObj = {"name": $scope.workspace.name, "description": $scope.workspace.description,
                                    "permission": $scope.workspace.permission};
                workspaceObj.parent = $scope.createWsParentId;
                workspaceObj.branched = $scope.createWsTime;
                promise = WorkspaceService.create(workspaceObj);
            }
            else if ($scope.itemType === 'Tag') {
                var config = {"name": $scope.configuration.name, "description": $scope.configuration.description};
                if ($scope.configuration.now === "false") {
                    config.timestamp = $filter('date')($scope.configuration.timestamp, 'yyyy-MM-ddTHH:mm:ss.sssZ');
                }
                promise = ConfigService.createConfig(config, $scope.createConfigParentId);
            }
            else if ($scope.itemType === 'Document') {
                promise = ViewService.createDocument($scope.doc.name, $scope.addDocSite, ws);
            }
            else if ($scope.itemType === 'View') {
                promise = ViewService.createView($scope.createViewParentId, $scope.newView.name, 
                                                 $scope.document.sysmlid, ws);
            }
            else {
                growl.error("Add Item of Type " + $scope.itemType + " is not supported");
                $scope.oking = false;
                return;
            }

            
            // Handle the promise:
            promise
            .then(function(data) {
                growl.success(displayName+" Created");

                if ($scope.itemType === 'Tag') {
                    growl.info('Please wait for a completion email prior to viewing of the tag.');
                }

                $modalInstance.close(data);
            }, function(reason) {
                growl.error("Create "+displayName+" Error: " + reason.message);
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
        node.loading = false;
        $scope.treeApi.refresh();
        if (view.specialization.displayedElements && view.specialization.displayedElements.length < 20) {
            ViewService.getViewElements(view.sysmlid, false, ws, time);
        }
    }

    // ViewCtrl creates this event when adding sections to the view
    $scope.$on('viewctrl.add.section', function(event, instanceSpec, parentBranchData) {

        var branch = $scope.treeApi.get_branch(parentBranchData);
        var viewid = null;
        if (branch.type === 'section')
            viewid = branch.view;
        else
            viewid = branch.data.sysmlid;
        var newbranch = {
            label: instanceSpec.name,
            type: "section",
            view: viewid,
            data: instanceSpec,
            children: [],
        };
        $scope.treeApi.add_branch(branch, newbranch, false);

        addSectionElements(instanceSpec, viewId2node[viewid], newbranch);
        $scope.treeApi.refresh();

    });

    // ViewCtrl creates this event when deleting sections from the view
    $scope.$on('viewctrl.delete.section', function(event, sectionData) {

        var branch = $scope.treeApi.get_branch(sectionData);

        $scope.treeApi.remove_single_branch(branch);
    });

    if ($state.includes('workspace.site.document')) {
        var delay = 0;
        if (document.specialization.view2view) {
            document.specialization.view2view.forEach(function(view, index) {
                $timeout(function() {
                    ViewService.getView(view.id, false, ws, time)
                    .then(addViewSections);
                    /*ViewService.getViewElements(view.id, false, ws, time)
                    .then(function() {
                        ViewService.getView(view.id, false, ws, time)
                        .then(addViewSections);
                    });*/
                }, delay*index);
            });
        }
    }
}]);