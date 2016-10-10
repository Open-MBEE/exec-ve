'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('TreeCtrl', ['$anchorScroll' , '$q', '$filter', '$location', '$uibModal', '$scope', '$rootScope', '$state', '$stateParams', '$compile','$timeout', 'growl', 
                          'UxService', 'ConfigService', 'ElementService', 'UtilsService', 'WorkspaceService', 'ViewService', 'MmsAppUtils',
                          'workspaces', 'workspaceObj', 'tag', 'sites', 'site', 'document', 'views', 'view', 'time', 'configSnapshots', 'docFilter', 'mmsRootSites',
function($anchorScroll, $q, $filter, $location, $uibModal, $scope, $rootScope, $state, $stateParams, $compile, $timeout, growl, UxService, ConfigService, ElementService, UtilsService, WorkspaceService, ViewService, MmsAppUtils, workspaces, workspaceObj, tag, sites, site, document, views, view, time, configSnapshots, docFilter, mmsRootSites) {

    $rootScope.mms_bbApi = $scope.bbApi = {};
    $rootScope.mms_treeApi = $scope.treeApi = {};
    if (!$rootScope.veTreeShowPe)
        $rootScope.veTreeShowPe = false;
    $scope.buttons = [];
    $scope.treeExpandLevel = 1;
    if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) 
        $scope.treeExpandLevel = 2;
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
        $scope.bbApi.addButton(UxService.getButtonBarButton("view-mode-dropdown"));
        $scope.bbApi.setToggleState('tree-show-pe', $rootScope.veTreeShowPe);
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
        if (document.specialization && document.specialization.view2view && document.specialization.view2view.length > 0) {
            growl.warning("Add View Error: This document hierarchy has not been migrated to support reordering views.");
            return;
        }
        $rootScope.mms_fullDocMode = false;
        $scope.bbApi.setToggleState("tree-full-document", false);
        $state.go('workspace.site.document.order', {search: undefined});
    });

    $scope.$on('tree-show-pe', function() {
        toggle('showTree');
        $rootScope.veTreeShowPe = true;
        setPeVisibility(viewId2node[document.sysmlid]);
        $scope.treeApi.refresh();
    });

    $scope.$on('tree-show-views', function() {
        toggle('showTree');
        $rootScope.veTreeShowPe = false;
        setPeVisibility(viewId2node[document.sysmlid]);
        $scope.treeApi.refresh();
    });

    $scope.tableList = [];
    $scope.figureList = [];
    $scope.equationList = [];
    $scope.treeViewModes = [{
        id: 'table',
        title: 'Tables',
        icon: 'fa-table',
        branchList: $scope.tableList,
    }, {
        id: 'figure',
        title: 'Figures',
        icon: 'fa-image',
        branchList: $scope.figureList,
    }, {
        id: 'equation',
        title: 'Equations',
        icon: 'fa-superscript',
        branchList: $scope.equationList,
    }];

    var toggle = function (id) {
        $scope.activeMenu = id;
    };
    // Set active tree view to tree
    toggle('showTree');

    $scope.$on('tree-show-tables', function() {
        //$scope.tableList.length = 0;
        //getPeTreeList(viewId2node[document.sysmlid], 'table',  $scope.tableList);
        //$scope.treeViewModes[0].branchList = $scope.tableList;
        toggle('table');
    });
    $scope.$on('tree-show-figures', function() {
        //$scope.figureList.length = 0;
        //getPeTreeList(viewId2node[document.sysmlid], 'figure', $scope.figureList);
        //$scope.treeViewModes[1].branchList = $scope.figureList;
        toggle('figure');
    });
    $scope.$on('tree-show-equations', function() {
        //$scope.equationList.length = 0;
        //getPeTreeList(viewId2node[document.sysmlid], 'equation', $scope.equationList);
        //$scope.treeViewModes[2].branchList = $scope.equationList;
        toggle('equation');
    });

    // Get a list of specific PE type from branch
    function getPeTreeList(branch, type, list) {
        if ( branch.type === type) {
            list.push(branch);
        }
        for (var i = 0; i < branch.children.length; i++) {
            getPeTreeList(branch.children[i], type, list);
        }
    }

    // Function to refresh table and figure list when new item added, deleted or reordered
    function resetPeList(elemType) {
        if (elemType == 'table' || elemType == 'all') {
            $scope.tableList.length = 0;
            getPeTreeList(viewId2node[document.sysmlid], 'table', $scope.tableList);
        }
        if (elemType == 'figure' || elemType == 'image' || elemType == 'all') {
            $scope.figureList.length = 0;
            getPeTreeList(viewId2node[document.sysmlid], 'figure', $scope.figureList);
        }
        if (elemType == 'equation' || elemType == 'all') {
            $scope.equationList.length = 0;
            getPeTreeList(viewId2node[document.sysmlid], 'equation', $scope.equationList);
        }
    }

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

    var isSiteInProject = function(sitesMapping, site) {
        if (mmsRootSites.length === 0)
            return true;
        var getRootSite = function(s) {
            var ret = s;
            while (ret.isCharacterization) {
                ret = sitesMapping[ret.parent];
            }
            return ret;
        };
        var root = getRootSite(site);
        if (mmsRootSites.indexOf(root.sysmlid) >= 0)
            return true;
        return false;
    };
    // Filter out alfresco sites
    var filter_sites = function(site_array) {
        var ret_array = [];
        var sitesMapping = {};
        var i;
        for (i = 0; i < site_array.length; i++) {
            sitesMapping[site_array[i].sysmlid] = site_array[i];
        }
        for (i = 0; i < site_array.length; i++) {
            var obj = site_array[i];
            if ((($scope.bbApi.getToggleState && $scope.bbApi.getToggleState('tree-showall-sites')) || 
                    obj.isCharacterization) && 
                    isSiteInProject(sitesMapping, obj)) {
                ret_array.push(obj);
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
    
    var viewId2node = {};
    var seenViewIds = {};
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
        var newChildNodes = [];
        childNodes.forEach(function(node) {
            if (seenViewIds[node.data.sysmlid]) {
                growl.error("Warning: View " + node.data.name + " have multiple parents! Duplicates not shown.");
                return;
            }
            seenViewIds[node.data.sysmlid] = node;
            newChildNodes.push(node);
        });
        curNode.children.push.apply(curNode.children, newChildNodes);
    };
    var processDeletedViewBranch = function(branch) {
        var sysmlid = branch.data.sysmlid;
        if (seenViewIds[sysmlid])
            delete seenViewIds[sysmlid];
        if (viewId2node[sysmlid])
            delete viewId2node[sysmlid];
        for (var i = 0; i < branch.children.length; i++) {
            processDeletedViewBranch(branch.children[i]);
        }
    };
    if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
        $scope.my_data = UtilsService.buildTreeHierarchy(workspaces, "id", 
                                                         "workspace", "parent", workspaceLevel2Func);
    } else if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document')) {
        $scope.my_data = UtilsService.buildTreeHierarchy(filter_sites(sites), "sysmlid", "site", "parent", siteInitFunc);
    } else {
        var seenChild = {};
        if (document.specialization.view2view && document.specialization.view2view.length > 0) {
            viewId2node[document.sysmlid] = {
                label: document.name,
                type: 'view',
                data: document,
                children: [],
                loading: false,
                aggr: 'COMPOSITE'
            };
            views.forEach(function(view) {
                var viewTreeNode = { 
                    label : view.name, 
                    type : "view",
                    data : view, 
                    children : [], 
                    loading: false,
                    aggr: 'COMPOSITE'
                };
                viewId2node[view.sysmlid] = viewTreeNode;
                    //addSectionElements(elements[i], viewTreeNode, viewTreeNode);
            });
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
            resetPeList('all');
        };

        var addContentsSectionTreeNode = function(operand) {
            var bulkGet = [];
            operand.forEach(function(instanceVal) {
                bulkGet.push(instanceVal.instance);
            });
          ElementService.getElements(bulkGet, false, ws, time, 0)
          .then(function(ignore) {
            var instances = [];
            operand.forEach(function(instanceVal) {
                instances.push(ElementService.getElement(instanceVal.instance, false, ws, time, 0));
            });
            $q.all(instances).then(function(results) {
                var k = results.length - 1;
                for (; k >= 0; k--) {
                    var instance = results[k];
                    var hide = !$rootScope.veTreeShowPe;
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
                    } else if (ViewService.getTreeType(instance)) {
                        var otherTreeNode = {
                            label : instance.name,
                            type : ViewService.getTreeType(instance),
                            view : viewNode.data.sysmlid,
                            data : instance,
                            hide: hide,
                            children: []
                        };
                        parentNode.children.unshift(otherTreeNode);
                    }
                }
                $scope.treeApi.refresh();
                resetPeList('all');
            }, function(reason) {
                //view is bad
            });
          }, function(reason) {
          });
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

        var j;
        if (contains) {
            j = contains.length - 1;
            for (; j >= 0; j--) {
                addContainsSectionTreeNode(contains[j]);
            }
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode(contents.operand);
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
            var view = (branch.type !== 'view') ? branch.view : branch.data.sysmlid;
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
                    children: []
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

                var addToFullDocView = function(node, curSection, prevSysml) {
                    var lastChild = prevSysml;
                    if (node.children) {
                        var num = 1;
                        node.children.forEach(function(cNode) {
                            $rootScope.$broadcast('newViewAdded', cNode.data.sysmlid, curSection + '.' + num, lastChild);
                            lastChild = addToFullDocView(cNode, curSection + '.' + num, cNode.data.sysmlid);
                            num = num + 1;
                        });
                    }
                    return lastChild;
                };

                if (itemType === 'View') {
                    viewId2node[data.sysmlid] = newbranch;
                    seenViewIds[data.sysmlid] = newbranch;
                    newbranch.aggr = $scope.newViewAggr.type;
                    var curNum = branch.children[branch.children.length-1].section;
                    var prevBranch = $scope.treeApi.get_prev_branch(newbranch);
                    while (prevBranch.type != 'view') {
                        prevBranch = $scope.treeApi.get_prev_branch(prevBranch);
                    }
                    MmsAppUtils.handleChildViews(data, $scope.newViewAggr.type, ws, time, handleSingleView, handleChildren)
                      .then(function(node) {
                          // handle full doc mode
                          if ($rootScope.mms_fullDocMode)
                              addToFullDocView(node, curNum, newbranch.data.sysmlid);
                          addViewSectionsRecursivelyForNode(node);
                    });
                    if (!$rootScope.mms_fullDocMode) 
                        $state.go('workspace.site.document.view', {view: data.sysmlid, search: undefined});
                    else {
                        if (prevBranch) {
                            $rootScope.$broadcast('newViewAdded', data.sysmlid, curNum, prevBranch.data.sysmlid);
                        } else {
                            $rootScope.$broadcast('newViewAdded', data.sysmlid, curNum, branch.data.sysmlid);
                        }
                    }
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
            if (document.specialization && document.specialization.view2view && document.specialization.view2view.length > 0) {
                growl.warning("Add View Error: This document hierarchy has not been migrated to support adding views.");
                return;
            }
            if (!branch) {
                growl.warning("Add View Error: Select parent view first");
                return;
            } else if (branch.type === "section") {
                growl.warning("Add View Error: Cannot add a child view to a section");
                return;
            } else if (branch.aggr === 'NONE') {
                growl.warning("Add View Error: Cannot add a child view to a non-owned and non-shared view.");
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
                if (curBranch.type !== 'view') {
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
            $rootScope.mms_fullDocMode = true;
            $scope.bbApi.setToggleState("tree-full-document", true);
            $state.go('workspace.site.document.full', {search: undefined}); 
        }
    };

    $scope.deleteItem = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }
        if ($state.includes('workspace.site.document')) { 
            if (branch.type !== 'view' || (branch.data.specialization && 
                    branch.data.specialization.type !=='View' && branch.data.specialization.type !== 'Product')) {
                growl.warning("Delete Error: Selected item is not a view.");
                return;
            }
            if (document.specialization && document.specialization.view2view && document.specialization.view2view.length > 0) {
                growl.warning("Delete View Error: This document hierarchy has not been migrated to support deleting views.");
                return;
            }
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
            if ($state.includes('workspace.site.document') && branch.type === 'view') {
                processDeletedViewBranch(branch);
            }
            if ($state.includes('workspace.sites') && !$state.includes('workspace.site.document'))
                return;

            // handle full doc mode
            if ($rootScope.mms_fullDocMode) {
                $state.go('workspace.site.document.full', {search: undefined});
                $state.reload();
            } else
                $state.go('^', {search: undefined});
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
            if (seenViewIds[viewId]) {
                growl.error("Error: View " + elem.name + " is already in this document.");
                return;
            }
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
                $scope.newViewAggr.type = "COMPOSITE";
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

    function setPeVisibility(branch) {
        if (branch.type === 'figure' || branch.type === 'table' || branch.type === 'equation') {
            branch.hide = !$rootScope.veTreeShowPe;
        }
        for (var i = 0; i < branch.children.length; i++) {
            setPeVisibility(branch.children[i]);
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
        var viewNode = viewId2node[viewid];
        instanceSpec.relatedDocuments = [
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
        var newbranch = {
            label: instanceSpec.name,
            type: (elemType === 'image' ? 'figure' : elemType),
            view: viewid,
            data: instanceSpec,
            hide: !$rootScope.veTreeShowPe && elemType !== 'section',
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
            addSectionElements(instanceSpec, viewNode, newbranch);

        $scope.treeApi.refresh();
        resetPeList(elemType);
    });

    // Utils creates this event when deleting instances from the view
    $scope.$on('viewctrl.delete.element', function(event, elementData) {

        var branch = $scope.treeApi.get_branch(elementData);
        if (branch)
            $scope.treeApi.remove_single_branch(branch);
        resetPeList(branch.type);
    });

    $scope.$on('view.reorder.saved', function(event, vid) {
        var node = viewId2node[vid];
        var viewNode = node;
        var newChildren = [];
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.type === 'view')
                newChildren.push(child);
        }
        node.children = newChildren;
        if (node.type === 'section') {
            viewNode = viewId2node[node.view];
            if (!viewNode)
                viewNode = node;
        }
        addSectionElements(node.data, viewNode, node);
    });

    if ($state.includes('workspace.site.document')) {
        $timeout(function() {
            if (document.specialization.view2view && document.specialization.view2view.length > 0) {
                document.specialization.view2view.forEach(function(view, index) {
                    ViewService.getView(view.id, false, ws, time, 0)
                    .then(addViewSections); //TODO add back in once we have priority queue
                });
            }
        }, 8000, false);
    }


    //TODO refresh table and fig list when new item added, deleted or reordered
    $scope.user_clicks_branch = function(branch) {
        $rootScope.mms_treeApi.user_clicks_branch(branch);
    };

}]);