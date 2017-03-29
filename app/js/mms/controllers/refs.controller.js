'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('RefsCtrl', ['$q', '$filter', '$location', '$uibModal', '$scope', '$rootScope', '$state','$timeout', 'growl', 
                         'UxService', 'ElementService', 'UtilsService', 'ProjectService', 'MmsAppUtils', 
                         'orgOb', 'projectOb', 'refOb', 'refObs', 'tagObs', 'branchObs',
function($q, $filter, $location, $uibModal, $scope, $rootScope, $state, $timeout, growl, 
    UxService, ElementService, UtilsService, ProjectService, MmsAppUtils, 
    orgOb, projectOb, refOb, refObs, tagObs, branchObs) {

    $rootScope.mms_refOb = refOb;
    $scope.refManageView = true;
    $scope.refData = [];
    $scope.bbApi = {};
    $scope.buttons = [];
    $scope.refList = refObs;
    $scope.branches = branchObs;
    $scope.tags = tagObs;
    $scope.refSelected = null;
    $scope.search = null;
    $scope.view = null;
    // var docEditable = documentOb && documentOb._editable && refOb && refOb.type === 'Branch' && UtilsService.isView(documentOb);

    $scope.bbApi.init = function() {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-task"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-tag"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete"));
        // $scope.bbApi.addButton(UxService.getButtonBarButton("tree-merge"));
        // $scope.bbApi.setPermission("tree-add-task", $scope.wsPerms);
        // $scope.bbApi.setPermission("tree-add-tag", $scope.wsPerms);
        // $scope.bbApi.setPermission("tree-delete", $scope.wsPerms);
        // $scope.bbApi.setPermission("tree-merge", $scope.wsPerms);
    };
    $scope.$on('tree-add-task', function(e) {
        addItem('Branch');
    });
    $scope.$on('tree-add-tag', function(e) {
        addItem('Tag');
    });


    $scope.refClickHandler = function(ref) {
        ProjectService.getRef(ref.id, projectOb.id).then(
            function(data) {
                $scope.refSelected = data;
            }, 
            function(error){
                growl.error("Ref click handler error: " + error );
                return;
            }
        );
    };

    // $scope.treeDblclickHandler = function(branch) {
    //     if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
    //         if (branch.type === 'group')
    //             $rootScope.ve_treeApi.expand_branch(branch);
    //         else if (branch.type === 'view' || branch.type === 'snapshot') {
    //             $state.go('project.ref.document', {documentId: branch.data.id, search: undefined});
    //         }
    //     } else if ($state.includes('project.ref.document')) {
    //         $rootScope.ve_treeApi.expand_branch(branch);
    //     }
    // };



    var addItem = function(itemType) {
        $scope.itemType = itemType;
        var branch = $scope.refSelected;
        var templateUrlStr = "";
    //     var newBranchType = "";
        var branchType = "";

    //      // Item specific setup:
        if (itemType === 'Branch') {
            if (!branch) {
                growl.warning("Add Task Error: Select a task or tag first");
                return;
            }
            if (branch.type === 'Tag') {
                // $scope.createWsParentId = branch.workspace;
                // $scope.createWsTime = branch.timestamp;
                $scope.from = 'Tag ' + branch.name;
            } else {
                $scope.createWsParentId = branch.id;
                $scope.createWsTime = $filter('date')(new Date(), 'yyyy-MM-ddTHH:mm:ss.sssZ');
                $scope.from = 'Task ' + branch.name;
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
        } else {
            growl.error("Add Item of Type " + itemType + " is not supported");
            return;
        }
        $scope.parentBranchData = branch.data;
        // Adds the branch:
        var instance = $uibModal.open({
            templateUrl: templateUrlStr,
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', '$filter', addItemCtrl]
        });
    //     instance.result.then(function(data) {
    //         var newbranch = {
    //             label: data.name,
    //             type: newBranchType,
    //             data: data,
    //             children: []
    //         };
            
    //         var top = false; //TODO fix tags and branch
    //         if (itemType === 'Document') {
    //             newbranch.groupId = branch.data._id;
    //         }
    //         $scope.treeApi.add_branch(branch, newbranch, top);

    //     });
    };

    var addItemCtrl = function($scope, $uibModalInstance, $filter) {
        $scope.createForm = true;
        $scope.oking = false;
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
       

        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise;

    //         // Item specific promise: //TODO branch and tags
    //         if ($scope.itemType === 'Document') {
    //             promise = ViewService.createDocument({
    //                 _projectId: projectOb.id,
    //                 _refId: refOb.id,
    //                 id: $scope.parentBranchData._id
    //             },{
    //                 viewName: $scope.newDoc.name,
    //                 isDoc: true
    //             });
    //         } else if ($scope.itemType === 'View') {
    //             $scope.newViewAggr.type = "composite";
    //             promise = ViewService.createView($scope.parentBranchData, {
    //                 viewName: $scope.newView.name
    //             });
    //         } else {
    //             growl.error("Add Item of Type " + $scope.itemType + " is not supported");
    //             $scope.oking = false;
    //             return;
    //         }

    //         promise.then(function(data) {
    //             growl.success(displayName+" Created");
    //             if ($scope.itemType === 'Tag') {
    //                 growl.info('Please wait for a completion email prior to viewing of the tag.');
    //             }
    //             $uibModalInstance.close(data);
    //         }, function(reason) {
    //             growl.error("Create "+displayName+" Error: " + reason.message);
    //         }).finally(function() {
    //             $scope.oking = false;
    //         });
        };

        $scope.cancel = function() {
            $uibModalInstance.dismiss();
        };
    };

    // $scope.deleteItem = function() {
    //     var branch = $scope.treeApi.get_selected_branch();
    //     if (!branch) {
    //         growl.warning("Delete Error: Select item to delete.");
    //         return;
    //     }
    //     if ($state.includes('project.ref.document')) { 
    //         if (branch.type !== 'view' || (!UtilsService.isView(branch.data))) {
    //             growl.warning("Delete Error: Selected item is not a view.");
    //             return;
    //         }
    //     }
    //     if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
    //         if (branch.type !== 'view' || (!UtilsService.isDocument(branch.data))) {
    //             growl.warning("Delete Error: Selected item is not a document.");
    //             return;
    //         }
    //     }
    //     // TODO: do not pass selected branch in scope, move page to generic location
    //     $scope.deleteBranch = branch;
    //     var instance = $uibModal.open({
    //         templateUrl: 'partials/mms/delete.html',
    //         scope: $scope,
    //         controller: ['$scope', '$uibModalInstance', deleteCtrl]
    //     });
    //     instance.result.then(function(data) {
    //         $scope.treeApi.remove_branch(branch);
    //         // if ($state.includes('project.ref.document') && branch.type === 'view') {
    //         //     processDeletedViewBranch(branch);
    //         // }
    //         if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
    //             return;
    //         }
    //         if ($rootScope.ve_fullDocMode) {
    //             $state.go('project.ref.document.full', {search: undefined});
    //             $state.reload();
    //         } else {
    //             $state.go('^', {search: undefined});
    //         }
    //     });
    // };

    // // TODO: Make this a generic delete controller
    // var deleteCtrl = function($scope, $uibModalInstance) {
    //     $scope.oking = false;
    //     var branch = $scope.deleteBranch;
    //     if (branch.type === 'view') {
    //         $scope.type = 'View';
    //         if (UtilsService.isDocument(branch.data))
    //             $scope.type = 'Document';
    //     }
    //     $scope.name = branch.data.name;
    //     $scope.ok = function() {
    //         if ($scope.oking) {
    //             growl.info("Please wait...");
    //             return;
    //         }
    //         $scope.oking = true;
    //         var promise = null;
    //         if (branch.type === 'view') {
    //             var parentBranch = $scope.treeApi.get_parent_branch(branch);
    //             if (!$state.includes('project.ref.document')) {
    //                 promise = ViewService.downgradeDocument(branch.data);
    //             } else {
    //                 promise = ViewService.removeViewFromParentView({
    //                     projectId: parentBranch.data._projectId,
    //                     refId: parentBranch.data._refId,
    //                     parentViewId: parentBranch.data.id,
    //                     viewId: branch.data.id
    //                 });
    //             }
    //         }
    //         promise.then(function(data) {
    //             growl.success($scope.type + " Deleted");
    //             $uibModalInstance.close('ok');
    //         }, function(reason) {
    //             growl.error($scope.type + ' Delete Error: ' + reason.message);
    //         }).finally(function() {
    //             $scope.oking = false;
    //         });
    //     };
    //     $scope.cancel = function() {
    //         $uibModalInstance.dismiss();
    //     };
    // };


}]);