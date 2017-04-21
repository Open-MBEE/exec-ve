'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('RefsCtrl', ['$sce', '$q', '$filter', '$location', '$uibModal', '$scope', '$rootScope', '$state','$timeout', 'growl', '_',
                         'UxService', 'ElementService', 'UtilsService', 'ProjectService', 'MmsAppUtils', 
                         'orgOb', 'projectOb', 'refOb', 'refObs', 'tagObs', 'branchObs',
function($sce, $q, $filter, $location, $uibModal, $scope, $rootScope, $state, $timeout, growl, _,
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
    $scope.activeTab = 0;
    $scope.refSelected = null;
    $scope.search = null;
    $scope.view = null;
    $scope.fromParams = {};
    if (_.isEmpty(refOb)) {
        $scope.fromParams.id = 'master';
        $scope.fromParams.name = 'master';
    } else {
        $scope.fromParams = refOb;
    }
    $scope.htmlTooltip = $sce.trustAsHtml('Branch temporarily unavailable during duplication.<br>Branch author will be notified by email upon completion.');
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
    $scope.$on('tree-delete', function(e) {
        deleteItem();
    });
    $scope.$on('fromParamChange', function(event, fromParams) {
        var index = _.findIndex(refObs, {name: fromParams.refId});
        if ( index > -1 ) {
            $scope.fromParams = refObs[index];
        }
    });
    $scope.$on("stomp.branchCreated", function(event, updateRef) {
        var index = -1;
        if (updateRef.type === 'Branch') {
            index = _.findIndex($scope.branches, {name: updateRef.id});
            if ( index > -1 ) {
                $scope.branches[index].loading = false;
                // $scope.branches[index] = updateRef;
            }
        } else if (updateRef.type === 'Tag') {
            index = _.findIndex($scope.tags, {name: updateRef.id});
            if ( index > -1 ) {
                $scope.tags[index].loading = false;
                // $scope.tags[index] = updateRef;
            }
        }
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

        // Item specific setup:
        if (itemType === 'Branch') {
            if (!branch) {
                growl.warning("Add Task Error: Select a task or tag first");
                return;
            }
            if (branch.type === 'Tag') {
                $scope.from = 'Tag ' + branch.name;
            } else {
                $scope.from = 'Task ' + branch.name;
            }
            $scope.createParentRefId = branch.id;
            templateUrlStr = 'partials/mms/new-task.html';
        } else if (itemType === 'Tag') {
            if (!branch) {
                growl.warning("Add Tag Error: Select parent task first");
                return;
            } 
            // else if (branch.type != "workspace") {
            //     growl.warning("Add Tag Error: Selection must be a task");
            //     return;
            // }
            $scope.createParentRefId = branch.id;
            templateUrlStr = 'partials/mms/new-tag.html';
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
            //TODO add to correct ref list
            if (data.type === 'Branch') {
                data.loading = true;
                $scope.branches.push(data);
                $scope.refSelected = data;
                $scope.activeTab = 0;
            } else {
                data.loading = true;
                $scope.tags.push(data);
                $scope.refSelected = data;
                $scope.activeTab = 1;
            }
        });
    };

    var addItemCtrl = function($scope, $uibModalInstance, $filter) {
        $scope.createForm = true;
        $scope.oking = false;
        var displayName = "";

        // Item specific setup:
        if ($scope.itemType === 'Branch') {
            $scope.workspace = {};
            $scope.workspace.name = "";
            $scope.workspace.description = "";
            $scope.workspace.permission = "read";
            displayName = "Branch";
        } else if ($scope.itemType === 'Tag') {
            $scope.configuration = {};
            $scope.configuration.name = "";
            $scope.configuration.description = "";
            displayName = "Tag";
        }

        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise;

            // Item specific promise:
            if ($scope.itemType === 'Branch') {
                var branchObj = {"name": $scope.workspace.name, "type": "Branch", 
                                "description": $scope.workspace.description};
                branchObj.parentRefId = $scope.createParentRefId;
                promise = ProjectService.createRef( branchObj, projectOb.id );
            } else if ($scope.itemType === 'Tag') {
                var tagObj = {"name": $scope.configuration.name, "type": "Tag",
                                "description": $scope.configuration.description};
                tagObj.parentRefId =  $scope.createParentRefId;
                promise = ProjectService.createRef( tagObj, projectOb.id );
            } else {
                growl.error("Add Item of Type " + $scope.itemType + " is not supported");
                $scope.oking = false;
                return;
            }

            promise.then(function(data) {
                growl.success(displayName+" Created");
                growl.info('Please wait for a completion email prior to viewing of the tag.', {ttl: -1});
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

    var deleteItem = function() {
        var branch = $scope.refSelected;
        if (!branch) {
            growl.warning("Delete Error: Select item to delete.");
            return;
        }
        $scope.deleteBranch = branch;
        var instance = $uibModal.open({
            templateUrl: 'partials/mms/delete.html',
            scope: $scope,
            controller: ['$scope', '$uibModalInstance', deleteCtrl]
        });
        instance.result.then(function(data) {
            //TODO $state project with no selected ref
            var index;
            if ($scope.refSelected.type === 'Branch') {
                index = $scope.branches.indexOf($scope.refSelected);
                $scope.branches.splice(index, 1);  
            } else if ($scope.refSelected.type === 'Tag') {
                index = $scope.tags.indexOf($scope.refSelected);
                $scope.tags.splice(index, 1);  
            }
            $scope.refSelected = null;
        });
    };

    var deleteCtrl = function($scope, $uibModalInstance) {
        $scope.oking = false;
        var branch = $scope.deleteBranch;
        if (branch.type === 'Tag') {
            $scope.type = 'Tag';
        } else if (branch.type === 'Branch') {
            $scope.type = 'Branch';
        }
        $scope.name = branch.name;
        $scope.ok = function() {
            if ($scope.oking) {
                growl.info("Please wait...");
                return;
            }
            $scope.oking = true;
            var promise = ProjectService.deleteRef(branch.id, projectOb.id);
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


}]);