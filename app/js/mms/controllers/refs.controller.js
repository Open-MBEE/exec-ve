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


    var selectMasterDefault = function() {
        var masterIndex = _.findIndex(refObs, {name: 'master'});
        if (masterIndex > -1) {
            $scope.fromParams = refObs[masterIndex];
            $scope.refSelected = refObs[masterIndex];
        }
    };

    if (_.isEmpty(refOb)) {
        selectMasterDefault();
    } else {
        $scope.fromParams = refOb;
        $scope.refSelected = refOb;
    }
    $scope.htmlTooltip = $sce.trustAsHtml('Branch temporarily unavailable during duplication.<br>Branch author will be notified by email upon completion.');
    // var refPerm = projectOb && projectOb._editable;

    $scope.bbApi.init = function() {
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-branch"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-add-tag"));
        $scope.bbApi.addButton(UxService.getButtonBarButton("tree-delete"));
        // $scope.bbApi.addButton(UxService.getButtonBarButton("tree-merge"));
        // $scope.bbApi.setPermission("tree-add-branch", $scope.refPerm);
        // $scope.bbApi.setPermission("tree-add-tag", $scope.refPerm);
        // $scope.bbApi.setPermission("tree-delete", $scope.refPerm);
        // $scope.bbApi.setPermission("tree-merge", $scope.refPerm);
    };
    $scope.$on('tree-add-branch', function(e) {
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
        // var index = -1;
        // if (updateRef.type === 'Branch') {
        //     index = _.findIndex($scope.branches, {name: updateRef.id});
        //     if ( index > -1 ) {
        //         $scope.branches[index].loading = false;
        //         // $scope.branches[index] = updateRef;
        //     }
        // } else if (updateRef.type === 'Tag') {
        //     index = _.findIndex($scope.tags, {name: updateRef.id});
        //     if ( index > -1 ) {
        //         $scope.tags[index].loading = false;
        //         // $scope.tags[index] = updateRef;
        //     }
        // }

        // Update tags list with latest from refOb
        var tag = [];
        for (var i = 0; i < $scope.refList.length; i++) {
            if ($scope.refList[i].type === "Tag")
                tag.push($scope.refList[i]);
        }
        $scope.tags = tag;

        // Update branches list with latest from refOb
        var branches = [];
        for (var j = 0; j < $scope.refList.length; j++) {
            if ($scope.refList[j].type === "Branch")
                branches.push($scope.refList[j]);
        }
        $scope.branches = branches;
        growl.success(updateRef.name + " " + updateRef.type + " Created");
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
                growl.warning("Add Branch Error: Select a branch or tag first");
                return;
            }
            if (branch.type === 'Tag') {
                $scope.from = 'Tag ' + branch.name;
            } else {
                $scope.from = 'Branch ' + branch.name;
            }
            $scope.createParentRefId = branch.id;
            templateUrlStr = 'partials/mms/new-task.html';
        } else if (itemType === 'Tag') {
            if (!branch) {
                growl.warning("Add Tag Error: Select a branch or tag first");
                return;
            }
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
            //TODO add load handling once mms returns status
            // var tag = [];
            // for (var i = 0; i < refObs.length; i++) {
            //     if (refObs[i].type === "Tag")
            //         tag.push(refObs[i]);
            // }
            // $scope.tags = tag;

            // var branches = [];
            // for (var j = 0; j < refObs.length; j++) {
            //     if (refObs[j].type === "Branch")
            //         branches.push(refObs[j]);
            // }
            // $scope.branches = branches;
            // if (data.type === 'Branch') {
            //     //data.loading = true;
            //     //$scope.branches.push(data);
            //     $scope.refSelected = data;
            //     $scope.activeTab = 0;
            // } else {
            //     //data.loading = true;
            //     //$scope.tags.push(data);
            //     $scope.refSelected = data;
            //     $scope.activeTab = 1;
            // }
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
                branchObj.permission = $scope.workspace.permission;
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
                growl.info('Please wait for a completion email prior to viewing of the '+$scope.itemType+'.', {ttl: -1});
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
                selectMasterDefault();
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