'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('TreeCtrl', ['$anchorScroll' , '$q', '$filter', '$location', '$uibModal', '$scope', '$rootScope', '$state', '$stateParams', '$compile','$timeout', 'growl', 
                          'UxService', 'ConfigService', 'ElementService', 'UtilsService', 'WorkspaceService', 'ViewService', 'MmsAppUtils',
                          'workspaces', 'workspaceObj', 'tag', 'sites', 'site', 'document', 'views', 'view', 'time', 'configSnapshots', 'docFilter',
function($anchorScroll, $q, $filter, $location, $uibModal, $scope, $rootScope, $state, $stateParams, $compile, $timeout, growl, UxService, ConfigService, ElementService, UtilsService, WorkspaceService, ViewService, MmsAppUtils, workspaces, workspaceObj, tag, sites, site, document, views, view, time, configSnapshots, docFilter) {

    $rootScope.mms_bbApi = $scope.bbApi = {};
    $rootScope.mms_treeApi = $scope.treeApi = {};
    $scope.buttons = [];
    $scope.treeExpandLevel = 1;
    if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) 
        $scope.treeExpandLevel = 0;
    $scope.treeSectionNumbering = false;
    if ($state.includes('workspace.site.document')) {
        $scope.treeSectionNumbering = true;
        $scope.treeExpandLevel = 3;
    }
    $rootScope.mms_fullDocMode = false;
    if ($state.includes('workspace.site.document.full'))
        $rootScope.mms_fullDocMode = true;
    $scope.treeFilter = {search: ''};
    // TODO: pull in config/tags
    var config = time;
    var ws = $stateParams.workspace; // TODO this is undefined, but is being used below

    if (document !== null) {
        $scope.document = document;
        $scope.editable = $scope.document.editable && time === 'latest' && $scope.document.specialization.type === 'Product' || $scope.document.specialization.type === 'View';
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
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree-expand"));
      $scope.bbApi.addButton(UxService.getButtonBarButton("tree-collapse"));
      //$scope.bbApi.addButton(UxService.getButtonBarButton("tree-filter"));

      if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-merge"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-task"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-configuration"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete"));
        $scope.bbApi.setPermission("tree-add-task", $scope.wsPerms);
        $scope.bbApi.setPermission("tree-delete", $scope.wsPerms);
        $scope.bbApi.setPermission("tree-merge", $scope.wsPerms);
      } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-showall-sites"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-document"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-document"));
        $scope.bbApi.setPermission("tree-add-document", config == 'latest' ? true : false);
        $scope.bbApi.setPermission("tree-delete-document", config == 'latest' ? true : false);
      } else if ($state.includes('workspace.site.document')) {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-reorder-view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-full-document"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-view"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-view"));
        $scope.bbApi.setPermission("tree-add-view", $scope.editable);
        $scope.bbApi.setPermission("tree-reorder-view", $scope.editable);
        $scope.bbApi.setPermission("tree-delete-view", $scope.editable);
        if ($rootScope.mms_fullDocMode)
            $scope.bbApi.setToggleState('tree-full-document', true);
      }
    };

    $scope.$on('tree-expand', function() {
        $scope.treeApi.expand_all();
    });

    $scope.$on('tree-collapse', function() {
        $scope.treeApi.collapse_all();
    });

    $scope.$on('tree-filter', function() {
        $scope.toggleFilter();
    });

    $scope.$on('tree-showall-sites', function() {
        $scope.toggleShowAllSites();
    });

    $scope.$on('tree-add-task', function() {
        $scope.addItem('Workspace');
    });

    $scope.$on('tree-add-configuration', function() {
        $scope.addItem('Tag');
    });

    $scope.$on('tree-add-document', function() {
        $scope.addItem('Document');
    });

    $scope.$on('tree-delete-document', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-add-view', function() {
        $scope.addItem('View');
    });

    $scope.$on('tree-delete', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-delete-view', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-merge', function() {
        $scope.mergeAssist();
    });

    $scope.$on('tree-reorder-view', function() {
        $rootScope.mms_fullDocMode = false;
        $scope.bbApi.setToggleState("tree-full-document", false);
        $state.go('workspace.site.document.order', {search: undefined});
    });

    var creatingSnapshot = false;
    $scope.$on('document-snapshot-create', function() {
        if (creatingSnapshot) {
            growl.info('Please Wait...');
            return;
        }
        creatingSnapshot = true;
        $rootScope.mms_tbApi.toggleButtonSpinner('document-snapshot-create');

        $scope.itemType = 'Tag';
        $scope.createConfigParentId = workspaceObj.id;
        $scope.configuration = {};
        $scope.configuration.now = true;
        var templateUrlStr = 'partials/mms/new-tag.html';
        var branchType = 'configuration';

        var instance = $uibModal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', '$filter', addItemCtrl]
        });
        instance.result.then(function(data) {

        }, function(reason) {
            growl.error("Snapshot Creation failed: " + reason.message);
        }).finally(function() {
            creatingSnapshot = false;
            $rootScope.mms_tbApi.toggleButtonSpinner('document-snapshot-create');
        });

        $rootScope.mms_tbApi.select('document-snapshot');

    });

    /* var refreshSnapshots = function() {
        $rootScope.mms_tbApi.toggleButtonSpinner('document-snapshot-refresh');
        ConfigService.getProductSnapshots(document.sysmlid, site.sysmlid, workspaceObj.id, true)
        .then(function(result) {
            $scope.snapshots = result;
        }, function(reason) {
            growl.error("Refresh Failed: " + reason.message);
        })
        .finally(function() {
            $rootScope.mms_tbApi.toggleButtonSpinner('document-snapshot-refresh');
            $rootScope.mms_tbApi.select('document-snapshot');

        });
    };

    $scope.$on('document-snapshot-refresh', refreshSnapshots); */

    $scope.$on('tree-full-document', function() {
        $scope.fullDocMode();
    });

    $scope.toggleFilter = function() {
        $scope.bbApi.toggleButtonState('tree-filter');
    };

    $scope.toggleShowAllSites = function() {
        $scope.bbApi.toggleButtonState('tree-showall-sites');
        $scope.my_data = UtilsService.buildTreeHierarchy(filter_sites(sites), "sysmlid", "site", "parent", siteInitFunc);
        $scope.mms_treeApi.clear_selected_branch();
    };

    // BEGIN @DEPRECATED
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
    
    // END @DEPRECATED
    
    $scope.mergeAssist = function() {
	    $rootScope.mergeInfo = {
	      pane: 'fromToChooser',
	      tree_rows: $rootScope.mms_treeApi.get_rows()
        };

        for (var rowItem in $rootScope.mergeInfo.tree_rows){
            if($rootScope.mms_treeApi.get_parent_branch($rootScope.mergeInfo.tree_rows[rowItem].branch) !== null){
                $rootScope.mergeInfo.tree_rows[rowItem].parentInfo = $rootScope.mms_treeApi.get_parent_branch($rootScope.mergeInfo.tree_rows[rowItem].branch);
            } else {
                $rootScope.mergeInfo.tree_rows[rowItem].parentInfo = null;
            }
        }
                
        var modalInstance = $uibModal.open({
	        templateUrl: 'partials/mms/merge_assistant.html',
	        controller: 'WorkspaceMergeAssistant'
        });
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
        //try background diff
        WorkspaceService.diff(targetWs, sourceWs, targetTime, sourceTime)
        .then(function(data) {
            if (data.status === 'GENERATING') {
                growl.info("tell user to wait for email");
                $scope.comparing = false;
                return;
            }
            $state.go('workspace.diff', {source: sourceWs, target: targetWs, sourceTime: sourceTime, targetTime: targetTime, search: undefined});
        });
    };

    // Filter out alfresco sites
    var filter_sites = function(site_array) {
        var ret_array = [];

        if ($scope.bbApi.getToggleState && $scope.bbApi.getToggleState('tree-showall-sites')) {
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

    var siteInitFunc = function(site, siteNode) {
        siteNode.expandable = true;
    };

    var siteLevel2Func = function(site, siteNode) {
        // Make sure we haven't already loaded the docs for this site
        if(siteNode.docsLoaded || siteNode.type !== 'site') return;
        // Set docs loaded attribute
        siteNode.docsLoaded = true;
        
        siteNode.loading = true;
        ViewService.getSiteDocuments(site, false, ws, config === 'latest' ? 'latest' : tag.timestamp, 2)
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
    
    /*var allViewLevel2Func = function() {
        document.specialization.view2view.forEach(function(view, index) {
            var node = viewId2node[view.id];
            if (node)
                viewLevel2Func(view.id, node);
        });
    };
    //TODO remove once we have priority queue
    /*var viewLevel2Func = function(vid, branch) {
        if (branch.type === 'view') {
            if (!branch.loaded) {
                branch.loaded = true;
                ViewService.getView(vid, false, ws, time)
                .then(function(view) {
                    addViewSections(view);
                });
            }
        }
    };*/
    var viewId2node = {};
    var handleSingleView = function(v, aggr) {
        var curNode = viewId2node[v.sysmlid];
        if (!curNode) {
            curNode = {
                label: v.name,
                type: 'view',
                data: v,
                children: [],
                loading: false,
                aggr: aggr
            };
            viewId2node[v.sysmlid] = curNode;
        }
        return curNode;
    };
    var handleChildren = function(curNode, childNodes) {
        curNode.children.push.apply(curNode.children, childNodes);
    };

    if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
        $scope.my_data = UtilsService.buildTreeHierarchy(workspaces, "id", 
                                                         "workspace", "parent", workspaceLevel2Func);
    } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
        $scope.my_data = UtilsService.buildTreeHierarchy(filter_sites(sites), "sysmlid", "site", "parent", siteInitFunc);
    } else {
        // this is from view editor
        viewId2node[document.sysmlid] = {
            label: document.name,
            type: 'view',
            data: document,
            children: [],
            loading: false
        };
        views.forEach(function(view) {
            var viewTreeNode = { 
                label : view.name, 
                type : "view",
                data : view, 
                children : [], 
                loading: false
            };
            viewId2node[view.sysmlid] = viewTreeNode;
            //addSectionElements(elements[i], viewTreeNode, viewTreeNode);
        });

        var seenChild = {};
      if (document.specialization.view2view) {
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
      } else {
        if (!document.specialization.childViews)
            document.specialization.childViews = [];
        MmsAppUtils.handleChildViews(document, 'COMPOSITE', ws, time, handleSingleView, handleChildren)
        .then(function(node) {
            for (var i in viewId2node) {
                addSectionElements(viewId2node[i].data, viewId2node[i], viewId2node[i]);
            }
            $scope.treeApi.refresh();
        }, function(reason) {
            console.log(reason);
        });
      }
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
            $scope.treeApi.refresh();
        };

        var addContentsSectionTreeNode = function(operand) {
            var instances = [];
            operand.forEach(function(instanceVal) {
                instances.push(ElementService.getElement(instanceVal.instance, false, ws, time, 0));
            });
            $q.all(instances).then(function(results) {
                var k = results.length - 1;
                for (; k >= 0; k--) {
                    var instance = results[k];
                    instance.relatedDocuments = [
                        {
                            parentViews: [{
                                name: viewNode.data.name,
                                sysmlid: viewNode.data.sysmlid
                            }],
                            siteCharacterizationId: document.siteCharacterizationId,
                            name: document.name,
                            sysmlid: document.sysmlid
                        }
                    ];
                    if (ViewService.isSection(instance)) {
                        var sectionTreeNode = {
                            label : instance.name,
                            type : "section",
                            view : viewNode.data.sysmlid,
                            data : instance,
                            children: []
                        };
                        viewId2node[instance.sysmlid] = sectionTreeNode;
                        parentNode.children.unshift(sectionTreeNode);
                        addSectionElements(instance, viewNode, sectionTreeNode);
                    } else if (ViewService.isFigure(instance)) {
                        var figureTreeNode = {
                            label : instance.name,
                            type : "figure",
                            view : viewNode.data.sysmlid,
                            data : instance,
                            children: []
                        };
                        parentNode.children.unshift(figureTreeNode);
                    } else if (ViewService.isTable(instance)) {
                        var tableTreeNode = {
                            label : instance.name,
                            type : "table",
                            view : viewNode.data.sysmlid,
                            data : instance,
                            children: []
                        };
                        parentNode.children.unshift(tableTreeNode);
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
                $state.go('workspace', {workspace: branch.data.id, tag: undefined, search: undefined});
            } else if (branch.type === 'configuration') {
                $state.go('workspace', {workspace: branch.workspace, tag: branch.data.id, search: undefined});
            }
        } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
            if (branch.type === 'site')
                $state.go('workspace.site', {site: branch.data.sysmlid, search: undefined});
            else if (branch.type === 'view' || branch.type === 'snapshot') {
                var documentSiteBranch = $rootScope.mms_treeApi.get_parent_branch(branch);
                $state.go('workspace.site.documentpreview', {site: documentSiteBranch.data.sysmlid, document: branch.data.sysmlid, search: undefined});
            }
        } else if ($state.includes('workspace.site.document')) {
            var view = (branch.type === 'section' || branch.type === 'figure' || branch.type === 'table') ? branch.view : branch.data.sysmlid;
            var sectionId = branch.type === 'section' ? branch.data.sysmlid : null;
            var hash = branch.data.sysmlid;
            if ($rootScope.mms_fullDocMode) {
                $location.hash(hash);
                $anchorScroll();
            } else if (branch.type === 'view' || branch.type === 'section') {
                $state.go('workspace.site.document.view', {view: branch.data.sysmlid, search: undefined});
            } else {
                $state.go('workspace.site.document.view', {view: view, search: undefined});
                $timeout(function() {
                    $location.hash(hash);
                    $anchorScroll();
                }, 1000, false);
            }
        }
        $rootScope.mms_tbApi.select('element-viewer');
    };

    $scope.dblclick_tree_handler = function(branch) {
        if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
            if (branch.type === 'site')
                $rootScope.mms_treeApi.expand_branch(branch);
            else if (branch.type === 'view' || branch.type === 'snapshot') {
                var documentSiteBranch = $rootScope.mms_treeApi.get_parent_branch(branch);
                $state.go('workspace.site.document', {site: documentSiteBranch.data.sysmlid, document: branch.data.sysmlid, search: undefined});
            }
        } else if ($state.includes('workspace.site.document')) {
            $rootScope.mms_treeApi.expand_branch(branch);
        }
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
        types: UxService.getTreeTypes()
    };
    if (!$state.includes('workspace.site.document'))
        $scope.tree_options.sort = sortFunction;
    if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document'))
        $scope.tree_options.expandCallback = siteLevel2Func;
    // TODO: this is a hack, need to resolve in alternate way    
    $timeout(function() {
        $scope.treeApi.refresh();
    }, 5000);


    $scope.addItem = function(itemType) {

        // TODO: combine templateUrlStr into one .html

        $scope.itemType = itemType;
        $scope.newViewAggr = {type: 'SHARED'};
        var branch = $scope.treeApi.get_selected_branch();
        var templateUrlStr = "";
        var branchType = "";
        var curLastChild = null;
        if(branch)
            curLastChild = branch.children[branch.children.length-1];
        
        // Adds the branch:
        var myAddBranch = function() {
            var instance = $uibModal.open({
                templateUrl: templateUrlStr,
                scope: $scope,
                controller: ['$scope', '$uibModalInstance', '$filter', addItemCtrl]
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
                    MmsAppUtils.handleChildViews(data, $scope.newViewAggr.type, ws, time, handleSingleView, handleChildren)
                    .then(function(node) {
                        //TODO handle full doc mode
                        addViewSectionsRecursivelyForNode(node);
                    });
                    if (!$rootScope.mms_fullDocMode) 
                        $state.go('workspace.site.document.view', {view: data.sysmlid, search: undefined});
                    else{
                      var curNum = branch.children[branch.children.length-1].section;
                      if (curLastChild && curLastChild.type === 'view') {
                        $rootScope.$broadcast('newViewAdded', data.sysmlid, curNum, curLastChild.data.sysmlid);
                      } else {
                        $rootScope.$broadcast('newViewAdded', data.sysmlid, curNum, branch.data.sysmlid);
                      }
                    }
                    // $state.go('.', {search: undefined}, {reload: true});
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

            //ElementService.isCacheOutdated(document.sysmlid, ws)
            //.then(function(status) {
            //    if (status.status) {
            //        if (!angular.equals(document.specialization.view2view, status.server.specialization.view2view)) {
            //            growl.error('The document hierarchy is outdated, refresh the page first!');
            //            return;
            //        } 
            //    } 
                $scope.createViewParentId = branch.data.sysmlid;
                $scope.createViewParent = branch.data;
                $scope.newView = {};
                $scope.newView.name = "";

                myAddBranch();

            //}, function(reason) {
            //    growl.error('Checking if document hierarchy is up to date failed: ' + reason.message);
            //});
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
            $scope.bbApi.setToggleState("tree-full-document", false);
            var curBranch = $scope.treeApi.get_selected_branch();
            if (curBranch) {
                var viewId;
                if (curBranch.type == 'section' || curBranch.type == 'table' || curBranch.type == 'figure') {
                    if (curBranch.type == 'section' && curBranch.data.specialization && curBranch.data.specialization.type === 'InstanceSpecification')
                        viewId = curBranch.data.sysmlid;
                    else
                        viewId = curBranch.view;
                }
                else
                    viewId = curBranch.data.sysmlid;
                $state.go('workspace.site.document.view', {view: viewId, search: undefined});
            }
        } else {
            if ($state.current.name === 'doc.all') {
                $rootScope.mms_fullDocMode = true;
                $scope.bbApi.setToggleState("tree-full-document", true);
                //allViewLevel2Func(); //TODO remove when priority queue is done
            } else {
                if (document.specialization.view2view && document.specialization.view2view.length > 30) {
                    var instance = $uibModal.open({
                        templateUrl: 'partials/mms/fullDocWarn.html',
                        controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                            $scope.ok = function() {$uibModalInstance.close('ok');};
                            $scope.cancel = function() {$uibModalInstance.close('cancel');};
                        }],
                        size: 'sm'
                    });
                    instance.result.then(function(choice) {
                        if (choice === 'ok') {
                            $rootScope.mms_fullDocMode = true;
                            //allViewLevel2Func(); //TODO remove when priority queue is done
                            $scope.bbApi.setToggleState("tree-full-document", true);
                            $state.go('workspace.site.document.full', {search: undefined}); 
                        }
                    });
                } else {
                    $rootScope.mms_fullDocMode = true;
                    //allViewLevel2Func(); //TODO remove when priority queue is done
                    $scope.bbApi.setToggleState("tree-full-document", true);
                    $state.go('workspace.site.document.full', {search: undefined}); 
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
            (branch.type !== 'view' || (branch.data.specialization && 
                branch.data.specialization.type !=='View' && branch.data.specialization.type !== 'Product'))) {
            growl.warning("Delete Error: Selected item is not a view.");
            return;
        }
        if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
            if (branch.type !== 'view' || (branch.data.specialization && branch.data.specialization.type !== 'Product')) {
                growl.warning("Delete Error: Selected item is not a document.");
                return;
            }
        }
        // TODO: do not pass selected branch in scope, move page to generic location
        $scope.deleteBranch = branch;
        var instance = $uibModal.open({
            templateUrl: 'partials/mms/delete.html',
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', deleteCtrl]
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
            if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document'))
                return;
            $state.go('^', {search: undefined});
            //TODO handle full doc mode??
        });
    };

    // TODO: Make this a generic delete controller
    var deleteCtrl = function($scope, $uibModalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        if (branch.type === 'workspace')
            $scope.type = 'Task';
        if (branch.type === 'configuration')
            $scope.type = 'Tag';
        if (branch.type === 'view') {
            $scope.type = 'View';
            if (branch.data.specialization.type === 'Product')
                $scope.type = 'Document';
        }
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
                var parentBranch = $scope.treeApi.get_parent_branch(branch);
                if (!$state.includes('workspace.site.document')) {
                    if (parentBranch && parentBranch.type === 'site')
                        promise = ViewService.downgradeDocument(branch.data, ws, parentBranch.data.sysmlid);
                    else
                        promise = ViewService.downgradeDocument(branch.data, ws);
                } else {
                    promise = ViewService.deleteViewFromParentView(branch.data.sysmlid, parentBranch.data.sysmlid, ws);
                }
            }
            promise.then(function(data) {
                growl.success($scope.type + " Deleted");
                $uibModalInstance.close('ok');
            }, function(reason) {
                growl.error($scope.type + ' Delete Error: ' + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });
        };
        $scope.cancel = function() {
            $uibModalInstance.dismiss();
        };
    };

    // Generic add controller    
    var addItemCtrl = function($scope, $uibModalInstance, $filter) {
        $scope.createForm = true;
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
            $scope.updateTimeOpt = function () {
                $scope.configuration.now ='false';
            };
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

        var searchFilter = function(results) {
            var views = [];
            for (var i = 0; i < results.length; i++) {
                if (results[i].specialization && 
                        (results[i].specialization.type === 'View' || results[i].specialization.type === 'Product')) {
                    views.push(results[i]);
                    if (results[i].properties)
                        delete results[i].properties;
                }
            }
            return views;
        };
       
        $scope.addView = function(elem) {
            var viewId = elem.sysmlid;
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

                ViewService.addViewToParentView(viewId, documentId, parentViewId, $scope.newViewAggr.type, workspace, viewOb)
                .then(function(data) {
                    growl.success("View Added");
                    $uibModalInstance.close(viewOb);
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

        $scope.searchOptions = {};
        $scope.searchOptions.callback = $scope.addView;
        $scope.searchOptions.itemsPerPage = 200;
        $scope.searchOptions.filterCallback = searchFilter;

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
                promise = ViewService.createView($scope.createViewParent, $scope.newView.name, 
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

                $uibModalInstance.close(data);
            }, function(reason) {
                growl.error("Create "+displayName+" Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            });
        };

        $scope.cancel = function() {
            $uibModalInstance.dismiss();
        };

    };

    function addViewSections(view) {
        var node = viewId2node[view.sysmlid];
        //stop spinny so perception is it loads faster, took out loading view elements for all views for performance
        node.loading = false;
        //$scope.treeApi.refresh();
        addSectionElements(view, node, node);
        //if (view.specialization.displayedElements && view.specialization.displayedElements.length < 20) {
        //    ViewService.getViewElements(view.sysmlid, false, ws, time);
        //}
    }

    function addViewSectionsRecursivelyForNode(node) {
        addViewSections(node.data);
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].type === 'view') {
                addViewSectionsRecursivelyForNode(node.children[i]);
            }
        }
    }
    // MmsAppUtils.addElementCtrl creates this event when adding sections, table and figures to the view
    $scope.$on('viewctrl.add.element', function(event, instanceSpec, elemType, parentBranchData) {
        if (elemType === 'paragraph' || elemType === 'list' || elemType === 'comment')
            return;
        var branch = $scope.treeApi.get_branch(parentBranchData);
        var viewid = null;
        if (branch.type === 'section')
            viewid = branch.view;
        else
            viewid = branch.data.sysmlid;
        var newbranch = {
            label: instanceSpec.name,
            type: (elemType === 'image' ? 'figure' : elemType),
            view: viewid,
            data: instanceSpec,
            children: [],
        };
        var i = 0;
        var lastSection = -1;
        var childViewFound = false;
        for (i = 0; i < branch.children.length; i++) {
            if (branch.children[i].type === 'view') {
                lastSection = i-1;
                childViewFound = true;
                break;
            }
        }
        if (lastSection == -1 && !childViewFound) //case when first child is view
            lastSection = branch.children.length-1;
        branch.children.splice(lastSection+1, 0, newbranch);
        if (elemType == 'section') 
            addSectionElements(instanceSpec, viewId2node[viewid], newbranch);
        $scope.treeApi.refresh();

    });

    // Utils creates this event when deleting instances from the view
    $scope.$on('viewctrl.delete.element', function(event, elementData) {

        var branch = $scope.treeApi.get_branch(elementData);
        if (branch)
            $scope.treeApi.remove_single_branch(branch);
    });

    if ($state.includes('workspace.site.document')) {
        $timeout(function() {
        if (document.specialization.view2view) {
            document.specialization.view2view.forEach(function(view, index) {
                ViewService.getView(view.id, false, ws, time, 0)
                .then(addViewSections); //TODO add back in once we have priority queue
            });
        }
    }, 8000, false);
        $timeout(function() {
            if ($rootScope.mms_treeInitial) {
                var node = viewId2node[$rootScope.mms_treeInitial];
                //var node = viewId2node[$rootScope.mms_treeInitial];
                //if (node)
                //    viewLevel2Func($rootScope.mms_treeInitial, node);
            }
        }, 0, false);
    }
    //if ($rootScope.mms_fullDocMode)
    //    $timeout(allViewLevel2Func, 0, false); //TODO remove when priority queue is done
}]);