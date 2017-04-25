'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('WorkspaceDiffElementViewController', ["_", "$timeout", "$scope", "$rootScope", "$state", "$stateParams", "$uibModal", "growl", "WorkspaceService", "ElementService", "diff", "UxService", 'sourceName', 'targetName',
function(_, $timeout, $scope, $rootScope, $state, $stateParams, $uibModal, growl, WorkspaceService, ElementService, diff, UxService, sourceName, targetName) {
    $rootScope.tbApi.select('diff.perspective.detail');
    
    $scope.source = $stateParams.source;
    $scope.target = $stateParams.target;
    $scope.sourceTime = $stateParams.sourceTime;
    $scope.targetTime = $stateParams.targetTime;
    $scope.diff = diff;

    $scope.sourceName = sourceName;
    $scope.targetName = targetName;

    $scope.options = $rootScope.options;
    
    // BEGIN TREE STUFF
    $scope.treeApi = {};

    $scope.treeData = [];
    
    $scope.treeData = $rootScope.treeData;

    $scope.options = {
      types: UxService.getTreeTypes(),
      statuses: {
        'moved'   : { style: "moved" },
        'added'   : { style: "addition" },
        'removed' : { style: "removal" },
        'updated' : { style: "update" },
        'conflict': { style: "" }
      }
    };

    var options = $scope.options;

    $rootScope.options = options;

    $timeout(function () { $scope.treeApi.refresh(); $scope.treeApi.expand_all(); $rootScope.treeApi = $scope.treeApi; } );
    
    $scope.treeHandler = function(branch) {
        var previousActiveElement = angular.element('.diff-row-selected');
        previousActiveElement.removeClass("diff-row-selected");
        var activeElement = angular.element('#'+branch.data.id);
        if(activeElement){
            if(!activeElement.isOnScreen()){
                activeElement.get(0).scrollIntoView();
            }
            activeElement.addClass("diff-row-selected");
        }
    };
    // END TREE STUFF
    
    $rootScope.$on('elementId', function(event, arg)
    {
	    $scope.change = $rootScope.id2change[arg];
    });
}]);