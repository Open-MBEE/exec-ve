'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('WorkspaceDiffTreeController', ["_", "$timeout", "$scope", "$rootScope", "$state", "$stateParams", "$modal", "growl", "WorkspaceService", "ElementService", "diff", "UxService",
function(_, $timeout, $scope, $rootScope, $state, $stateParams, $modal, growl, WorkspaceService, ElementService, diff, UxService) {

    $scope.treeApi = {};
    
    $rootScope.hideRightPane = true;

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
}]);