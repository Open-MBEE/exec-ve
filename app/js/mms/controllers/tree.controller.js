'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('TreeCtrl', ['$anchorScroll' , '$q', '$filter', '$location', '$uibModal', '$scope', '$rootScope', '$state','$timeout', 'growl', 
                          'UxService', 'ElementService', 'UtilsService', 'ViewService', 'ProjectService', 'MmsAppUtils', 'documentOb', 'viewOb',
                          'orgOb', 'projectOb', 'refOb', 'refObs', 'groupObs',
function($anchorScroll, $q, $filter, $location, $uibModal, $scope, $rootScope, $state, $timeout, growl, 
    UxService, ElementService, UtilsService, ViewService, ProjectService, MmsAppUtils, documentOb, viewOb,
    orgOb, projectOb, refOb, refObs, groupObs) {

    $rootScope.mms_refOb = refOb;
    $rootScope.ve_bbApi = $scope.bbApi = {};
    $rootScope.ve_treeApi = $scope.treeApi = {};
    $rootScope.ve_tree_pane = $scope.$pane;
    if (!$rootScope.veTreeShowPe) {
        $rootScope.veTreeShowPe = false;
    }
    $scope.buttons = [];
    $scope.projectOb = projectOb;
    $scope.refOb = refOb;
    $scope.treeExpandLevel = 1;
    if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
        $scope.treeExpandLevel = 0;
    }
    $scope.treeSectionNumbering = false;
    if ($state.includes('project.ref.document')) {
        $scope.treeSectionNumbering = true;
        $scope.treeExpandLevel = 3;
    }
    $rootScope.ve_fullDocMode = false;
    if ($state.includes('project.ref.document.full')) {
        $rootScope.ve_fullDocMode = true;
    }
    $scope.treeFilter = {search: ''};
    var docEditable = documentOb && documentOb._editable && refOb && refOb.type === 'Branch' && UtilsService.isView(documentOb);

    $scope.bbApi.init = function() {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-expand"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-collapse"));
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-document"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-document"));
            $scope.bbApi.setPermission( "tree-add-document", documentOb._editable && (refOb.type === 'Tag' ? false : true) );
            $scope.bbApi.setPermission( "tree-delete-document", documentOb._editable &&  (refOb.type === 'Tag' ? false : true) );
        } else if ($state.includes('project.ref.document')) {
            $scope.bbApi.addButton(UxService.getButtonBarButton("view-mode-dropdown"));
            $scope.bbApi.setToggleState('tree-show-pe', $rootScope.veTreeShowPe);
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-reorder-view"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-full-document"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-view"));
            $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete-view"));
            $scope.bbApi.setPermission("tree-add-view", docEditable);
            $scope.bbApi.setPermission("tree-reorder-view", docEditable);
            $scope.bbApi.setPermission("tree-delete-view", docEditable);
            if ($rootScope.ve_fullDocMode) {
                $scope.bbApi.setToggleState('tree-full-document', true);
            }
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

    $scope.$on('tree-add-document', function() {
        addItem('Document');
    });

    $scope.$on('tree-delete-document', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-add-view', function() {
        addItem('View');
    });

    $scope.$on('tree-delete', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-delete-view', function() {
        $scope.deleteItem();
    });

    $scope.$on('tree-reorder-view', function() {
        $rootScope.ve_fullDocMode = false;
        $scope.bbApi.setToggleState("tree-full-document", false);
        $state.go('project.ref.document.order', {search: undefined});
    });

    $scope.$on('tree-show-pe', function() {
        toggle('showTree');
        $rootScope.veTreeShowPe = true;
        setPeVisibility(viewId2node[documentOb.id]);
        $scope.treeApi.refresh();
    });

    $scope.$on('tree-show-views', function() {
        toggle('showTree');
        $rootScope.veTreeShowPe = false;
        setPeVisibility(viewId2node[documentOb.id]);
        $scope.treeApi.refresh();
    });

    $scope.tableList = [];
    $scope.figureList = [];
    $scope.equationList = [];
    $scope.treeViewModes = [{
        id: 'table',
        title: 'Tables',
        icon: 'fa-table',
        branchList: $scope.tableList
    }, {
        id: 'figure',
        title: 'Figures',
        icon: 'fa-image',
        branchList: $scope.figureList
    }, {
        id: 'equation',
        title: 'Equations',
        icon: 'fa-superscript',
        branchList: $scope.equationList
    }];

    var toggle = function (id) {
        $scope.activeMenu = id;
    };
    // Set active tree view to tree
    toggle('showTree');

    $scope.$on('tree-show-tables', function() {
        toggle('table');
    });
    $scope.$on('tree-show-figures', function() {
        toggle('figure');
    });
    $scope.$on('tree-show-equations', function() {
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
    function resetPeTreeList(elemType) {
        if (elemType == 'table' || elemType == 'all') {
            $scope.tableList.length = 0;
            getPeTreeList(viewId2node[documentOb.id], 'table', $scope.tableList);
        }
        if (elemType == 'figure' || elemType == 'image' || elemType == 'all') {
            $scope.figureList.length = 0;
            getPeTreeList(viewId2node[documentOb.id], 'figure', $scope.figureList);
        }
        if (elemType == 'equation' || elemType == 'all') {
            $scope.equationList.length = 0;
            getPeTreeList(viewId2node[documentOb.id], 'equation', $scope.equationList);
        }
    }

    $scope.$on('tree-full-document', function() {
        $scope.fullDocMode();
    });

    $scope.toggleFilter = function() {
        $scope.bbApi.toggleButtonState('tree-filter');
    };

    var groupLevel2Func = function(groupOb, groupNode) {
        groupNode.loading = true;
        ViewService.getProjectDocuments({
                    projectId: projectOb.id,
                    refId: refOb.id
        }, 2).then(function(documentObs) {
            var docs = [];
            var docOb, i;
            for (i = 0; i < documentObs.length; i++) {
                docOb = documentObs[i];
                if (docOb._groupId === groupOb._id) {
                    docs.push(docOb);
                }
            }
            for (i = 0; i < docs.length; i++) {
                docOb = docs[i];
                groupNode.children.unshift({
                    label: docOb.name,
                    type: refOb.type === 'Branch' ? 'view' : 'snapshot',
                    data: docOb,
                    group: groupOb,
                    children: []
                });
            }
            groupNode.loading = false;
            if ($scope.treeApi.refresh) {
                $scope.treeApi.refresh();
            }
        });
    };
    
    var viewId2node = {};
    var seenViewIds = {};
    var handleSingleView = function(v, aggr) {
        var curNode = viewId2node[v.id];
        if (!curNode) {
            curNode = {
                label: v.name,
                type: 'view',
                data: v,
                children: [],
                loading: true,
                aggr: aggr
            };
            viewId2node[v.id] = curNode;
        }
        return curNode;
    };
    var handleChildren = function(curNode, childNodes) {
        var newChildNodes = [];
        var node;
        for (var i = 0; i < childNodes.length; i++) {
            node = childNodes[i];
            if (seenViewIds[node.data.id]) {
                growl.error("Warning: View " + node.data.name + " have multiple parents! Duplicates not shown.");
                continue;
            }
            seenViewIds[node.data.id] = node;
            newChildNodes.push(node);
        }
        curNode.children.push.apply(curNode.children, newChildNodes);
        curNode.loading = false;
        if ($scope.treeApi.refresh) {
            $scope.treeApi.refresh();
        }
    };
    var processDeletedViewBranch = function(branch) {
        var id = branch.data.id;
        if (seenViewIds[id]) {
            delete seenViewIds[id];
        }
        if (viewId2node[id]) {
            delete viewId2node[id];
        }
        for (var i = 0; i < branch.children.length; i++) {
            processDeletedViewBranch(branch.children[i]);
        }
    };
    if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
        $scope.treeData = UtilsService.buildTreeHierarchy(groupObs, "_id", "group", "_parentId", groupLevel2Func);
        ViewService.getProjectDocuments({
                    projectId: projectOb.id,
                    refId: refOb.id
        }, 2).then(function(documentObs) {
            for (var i = 0; i < documentObs.length; i++) {
                if (!documentObs[i]._groupId) {
                    $scope.treeData.push({
                        label: documentObs[i].name,
                        type: 'view',
                        data: documentObs[i],
                        children: []
                    });
                }
            }
            if ($scope.treeApi.refresh) {
                $scope.treeApi.refresh();
            }
        });
    } else {
        var seenChild = {};        
        if (!documentOb._childViews) {
            documentOb._childViews = [];
        }
        MmsAppUtils.handleChildViews(documentOb, 'composite', projectOb.id, refOb.id, handleSingleView, handleChildren)
        .then(function(node) {
            var bulkGet = [];
            for (var i in viewId2node) {
                var view = viewId2node[i].data;
                if (view._contents && view._contents.operand) {
                    for (var j = 0; j < view._contents.operand.length; j++) {
                        bulkGet.push(view._contents.operand[j].instanceId);
                    }
                }
            }
            ElementService.getElements({
                elementIds: bulkGet,
                projectId: projectOb.id,
                refId: refOb.id
            }, 0).finally(function() {
                for (var i in viewId2node) {
                    addSectionElements(viewId2node[i].data, viewId2node[i], viewId2node[i]);
                }
                $scope.treeApi.refresh();
            });
        }, function(reason) {
            console.log(reason);
        });
        $scope.treeData = [viewId2node[documentOb.id]];
    }

    function addSectionElements(element, viewNode, parentNode) {
        var contents = null;

        var addContentsSectionTreeNode = function(operand) {
            var bulkGet = [];
            var i = 0;
            for (i = 0; i < operand.length; i++) {
                bulkGet.push(operand[i].instanceId);
            }
            ElementService.getElements({
                elementIds: bulkGet, 
                projectId: projectOb.id,
                refId: refOb.id,
            }, 0).then(function(ignore) {
                var instances = [];
                for (var i = 0; i < operand.length; i++) {
                    instances.push(ElementService.getElement({
                        projectId: projectOb.id,
                        refId: refOb.id,
                        elementId: operand[i].instanceId, 
                    }, 0));
                }
                $q.all(instances).then(function(results) {
                    var k = results.length - 1;
                    for (; k >= 0; k--) {
                        var instance = results[k];
                        var hide = !$rootScope.veTreeShowPe;
                        if (ViewService.isSection(instance)) {
                            var sectionTreeNode = {
                                label : instance.name,
                                type : "section",
                                viewId : viewNode.data.id,
                                data : instance,
                                children: []
                            };
                            viewId2node[instance.id] = sectionTreeNode;
                            parentNode.children.unshift(sectionTreeNode);
                            addSectionElements(instance, viewNode, sectionTreeNode);
                        } else if (ViewService.getTreeType(instance)) {
                            var otherTreeNode = {
                                label : instance.name,
                                type : ViewService.getTreeType(instance),
                                viewId : viewNode.data.id,
                                data : instance,
                                hide: hide,
                                children: []
                            };
                            parentNode.children.unshift(otherTreeNode);
                        }
                    }
                    $scope.treeApi.refresh();
                    resetPeTreeList('all');
                }, function(reason) {
                    //view is bad
                });
            }, function(reason) {
            });
        };

        if (element._contents) {
            contents = element._contents;
        } else if (ViewService.isSection(element) && element.specification) {
            contents = element.specification; // For Sections, the contents expression is the specification
        } else {
            //bad?
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode(contents.operand);
        }
    }

    $scope.treeClickHandler = function(branch) {
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type === 'group') {
                $state.go('project.ref.preview', {documentId: 'site_' + branch.data._id + '_cover', search: undefined});
            } else if (branch.type === 'view' || branch.type === 'snapshot') {
                $state.go('project.ref.preview', {documentId: branch.data.id, search: undefined});
            }
        } else if ($state.includes('project.ref.document')) {
            var viewId = (branch.type !== 'view') ? branch.viewId : branch.data.id;
            var sectionId = branch.type === 'section' ? branch.data.id : null;
            var hash = branch.data.id;
            if ($rootScope.ve_fullDocMode) {
                $location.hash(hash);
                $anchorScroll();
            } else if (branch.type === 'view' || branch.type === 'section') {
                $state.go('project.ref.document.view', {viewId: branch.data.id, search: undefined});
            } else {
                $state.go('project.ref.document.view', {viewId: viewId, search: undefined});
                $timeout(function() {
                    $location.hash(hash);
                    $anchorScroll();
                }, 1000, false);
            }
        }
        $rootScope.ve_tbApi.select('element-viewer');
    };

    $scope.treeDblclickHandler = function(branch) {
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type === 'group')
                $rootScope.ve_treeApi.expand_branch(branch);
            else if (branch.type === 'view' || branch.type === 'snapshot') {
                $state.go('project.ref.document', {documentId: branch.data.id, search: undefined});
            }
        } else if ($state.includes('project.ref.document')) {
            $rootScope.ve_treeApi.expand_branch(branch);
        }
    };

    // TODO: Update sort function to handle all cases
    var treeSortFunction = function(a, b) {

        a.priority = 100;
        if (a.type === 'tag') {
            a.priority = 0 ;
        } else if (a.type === 'group') {
            a.priority = 1;
        } else if (a.type === 'view') {
            a.priority = 2;
        }
        b.priority = 100;
        if (b.type === 'tag') {
            b.priority = 0 ;
        } else if (b.type === 'group') {
            b.priority = 1;
        } else if (b.type === 'view') {
            b.priority = 2;
        }

        if (a.priority < b.priority)
            return -1;
        if (a.priority > b.priority)
            return 1;
        if (!a.label) {
            a.label = '';
        }
        if (!b.label) {
            b.label = '';
        }
        if (a.label.toLowerCase() < b.label.toLowerCase())
            return -1;
        if (a.label.toLowerCase() > b.label.toLowerCase())
            return 1;
        return 0;
    };

    $scope.treeOptions = {
        types: UxService.getTreeTypes()
    };
    if (!$state.includes('project.ref.document')) {
        $scope.treeOptions.sort = treeSortFunction;
    }
    // TODO: this is a hack, need to resolve in alternate way    
    $timeout(function() {
        $scope.treeApi.refresh();
    }, 5000);

    $scope.fullDocMode = function() {
        if ($rootScope.ve_fullDocMode) {
            $rootScope.ve_fullDocMode = false;
            $scope.bbApi.setToggleState("tree-full-document", false);
            var curBranch = $scope.treeApi.get_selected_branch();
            if (curBranch) {
                var viewId;
                if (curBranch.type !== 'view') {
                    if (curBranch.type == 'section' && curBranch.data.type === 'InstanceSpecification') {
                        viewId = curBranch.data.id;
                    } else {
                        viewId = curBranch.viewId;
                    }
                } else {
                    viewId = curBranch.data.id;
                }
                $state.go('project.ref.document.view', {viewId: viewId, search: undefined});
            }
        } else {
            $rootScope.ve_fullDocMode = true;
            $scope.bbApi.setToggleState("tree-full-document", true);
            $state.go('project.ref.document.full', {search: undefined}); 
        }
    };

    var addItem = function(itemType) {
        $scope.itemType = itemType;
        $scope.newViewAggr = {type: 'shared'};
        var branch = $scope.treeApi.get_selected_branch();
        var templateUrlStr = "";
        var newBranchType = "";
        
        if (itemType === 'Document') {
            if (!branch) {
                $scope.parentBranchData = {_id: "holding_bin_" + projectOb.id};
            } else if (branch.type !== 'group') {
                growl.warning("Select a group to add document under");
                return;
            } else {
                $scope.parentBranchData = branch.data;
            }
            templateUrlStr = 'partials/mms/new-doc.html';
            newBranchType = 'view';
        } else if (itemType === 'View') {
            if (!branch) {
                growl.warning("Add View Error: Select parent view first");
                return;
            } else if (branch.type === "section") {
                growl.warning("Add View Error: Cannot add a child view to a section");
                return;
            } else if (branch.aggr === 'none') {
                growl.warning("Add View Error: Cannot add a child view to a non-owned and non-shared view.");
                return;
            }
            $scope.parentBranchData = branch.data;
            templateUrlStr = 'partials/mms/new-view.html';
            newBranchType = 'view';
        } else {
            growl.error("Add Item of Type " + itemType + " is not supported");
            return;
        }
        // Adds the branch:
        var instance = $uibModal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', '$filter', addItemCtrl]
        });
        instance.result.then(function(data) {
            var newbranch = {
                label: data.name,
                type: newBranchType,
                data: data,
                children: []
            };
            $scope.treeApi.add_branch(branch, newbranch, false);

            var addToFullDocView = function(node, curSection, prevSysml) {
                var lastChild = prevSysml;
                if (node.children) {
                    var num = 1;
                    for (var i = 0; i < node.children.length; i++) {
                        var cNode = node.children[i];
                        $rootScope.$broadcast('newViewAdded', cNode.data.id, curSection + '.' + num, lastChild);
                        lastChild = addToFullDocView(cNode, curSection + '.' + num, cNode.data.id);
                        num = num + 1;
                    }
                }
                return lastChild;
            };

            if (itemType === 'View') {
                viewId2node[data.id] = newbranch;
                seenViewIds[data.id] = newbranch;
                newbranch.aggr = $scope.newViewAggr.type;
                var curNum = branch.children[branch.children.length-1].section;
                var prevBranch = $scope.treeApi.get_prev_branch(newbranch);
                while (prevBranch.type != 'view') {
                    prevBranch = $scope.treeApi.get_prev_branch(prevBranch);
                }
                MmsAppUtils.handleChildViews(data, $scope.newViewAggr.type, projectOb.id, refOb.id, handleSingleView, handleChildren)
                  .then(function(node) {
                      // handle full doc mode
                      if ($rootScope.ve_fullDocMode) {
                          addToFullDocView(node, curNum, newbranch.data.id);
                      }
                      addViewSectionsRecursivelyForNode(node);
                });
                if (!$rootScope.ve_fullDocMode) {
                    $state.go('project.ref.document.view', {viewId: data.id, search: undefined});
                } else {
                    if (prevBranch) {
                        $rootScope.$broadcast('newViewAdded', data.id, curNum, prevBranch.data.id);
                    } else {
                        $rootScope.$broadcast('newViewAdded', data.id, curNum, branch.data.id);
                    }
                }
            }
        });
    };

    var addItemCtrl = function($scope, $uibModalInstance, $filter) {
        $scope.createForm = true;
        $scope.oking = false;
        $scope.projectOb = projectOb;
        $scope.refOb = refOb;
        var displayName = "";

        if ($scope.itemType === 'Document') {
            $scope.newDoc = {name: ""};
            displayName = "Document";
        } else if ($scope.itemType === 'View') {
            $scope.newView = {name: ''};
            displayName = "View";
        } else {
            growl.error("Add Item of Type " + $scope.itemType + " is not supported");
            return;
        }
       
        var addExistingView = function(view) {
            var viewId = view.id;
            if (seenViewIds[viewId]) {
                growl.error("Error: View " + view.name + " is already in this document.");
                return;
            }
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;  
            ViewService.addViewToParentView({
                parentViewId: $scope.parentBranchData.id,
                viewId: viewId,
                projectId: $scope.parentBranchData._projectId,
                refId: $scope.parentBranchData._refId,
                aggr: $scope.newViewAggr.type
            }).then(function(data) {
                growl.success("View Added");
                $uibModalInstance.close(view);
            }, function(reason) {
                growl.error("View Add Error: " + reason.message);
            }).finally(function() {
                $scope.oking = false;
            }); 
        };


        var queryFilter = function() {
            var obj = {};
            obj.terms = {'_appliedStereotypeIds': [UtilsService.VIEW_SID, UtilsService.DOCUMENT_SID]};
            return obj;
        };

        $scope.searchOptions = {
            callback: addExistingView,
            itemsPerPage: 200,
            filterQueryList: [queryFilter]

        };

        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise;

            // Item specific promise: //TODO branch and tags
            if ($scope.itemType === 'Document') {
                promise = ViewService.createDocument({
                    _projectId: projectOb.id,
                    _refId: refOb.id,
                    id: $scope.parentBranchData._id
                },{
                    viewName: $scope.newDoc.name,
                    isDoc: true
                });
            } else if ($scope.itemType === 'View') {
                $scope.newViewAggr.type = "composite";
                promise = ViewService.createView($scope.parentBranchData, {
                    viewName: $scope.newView.name
                });
            } else {
                growl.error("Add Item of Type " + $scope.itemType + " is not supported");
                $scope.oking = false;
                return;
            }

            promise.then(function(data) {
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

    $scope.deleteItem = function() {
        var branch = $scope.treeApi.get_selected_branch();
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }
        if ($state.includes('project.ref.document')) { 
            if (branch.type !== 'view' || (!UtilsService.isView(branch.data))) {
                growl.warning("Delete Error: Selected item is not a view.");
                return;
            }
        }
        if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
            if (branch.type !== 'view' || (!UtilsService.isDocument(branch.data))) {
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
            $scope.treeApi.remove_branch(branch);
            if ($state.includes('project.ref.document') && branch.type === 'view') {
                processDeletedViewBranch(branch);
            }
            if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
                return;
            }
            if ($rootScope.ve_fullDocMode) {
                $state.go('project.ref.document.full', {search: undefined});
                $state.reload();
            } else {
                $state.go('^', {search: undefined});
            }
        });
    };

    // TODO: Make this a generic delete controller
    var deleteCtrl = function($scope, $uibModalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        if (branch.type === 'view') {
            $scope.type = 'View';
            if (UtilsService.isDocument(branch.data))
                $scope.type = 'Document';
        }
        $scope.name = branch.data.name;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise = null;
            if (branch.type === 'view') {
                var parentBranch = $scope.treeApi.get_parent_branch(branch);
                if (!$state.includes('project.ref.document')) {
                    promise = ViewService.downgradeDocument(branch.data);
                } else {
                    promise = ViewService.removeViewFromParentView({
                        projectId: parentBranch.data._projectId,
                        refId: parentBranch.data._refId,
                        parentViewId: parentBranch.data.id,
                        viewId: branch.data.id
                    });
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

    function addViewSections(view) {
        var node = viewId2node[view.id];
        addSectionElements(view, node, node);
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
        var viewId = null;
        if (branch.type === 'section') {
            viewId = branch.viewId;
        } else {
            viewId = branch.data.id;
        }
        var viewNode = viewId2node[viewId];
        var newbranch = {
            label: instanceSpec.name,
            type: (elemType === 'image' ? 'figure' : elemType),
            viewId: viewId,
            data: instanceSpec,
            hide: !$rootScope.veTreeShowPe && elemType !== 'section',
            children: []
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
        if (lastSection == -1 && !childViewFound) {//case when first child is view
            lastSection = branch.children.length-1;
        }
        branch.children.splice(lastSection+1, 0, newbranch);
        if (elemType == 'section') {
            addSectionElements(instanceSpec, viewNode, newbranch);
        }
        $scope.treeApi.refresh();
        resetPeTreeList(elemType);
    });

    // Utils creates this event when deleting instances from the view
    $scope.$on('viewctrl.delete.element', function(event, elementData) {
        var branch = $scope.treeApi.get_branch(elementData);
        if (branch) {
            $scope.treeApi.remove_single_branch(branch);
        }
        resetPeTreeList(branch.type);
    });

    $scope.$on('view.reorder.saved', function(event, vid) {
        var node = viewId2node[vid];
        var viewNode = node;
        var newChildren = [];
        for (var i = 0; i < node.children.length; i++) {
            var child = node.children[i];
            if (child.type === 'view') {
                newChildren.push(child);
            }
        }
        node.children = newChildren;
        if (node.type === 'section') {
            viewNode = viewId2node[node.view];
            if (!viewNode) {
                viewNode = node;
            }
        }
        addSectionElements(node.data, viewNode, node);
    });

    //TODO refresh table and fig list when new item added, deleted or reordered
    $scope.user_clicks_branch = function(branch) {
        $rootScope.ve_treeApi.user_clicks_branch(branch);
    };
}]);