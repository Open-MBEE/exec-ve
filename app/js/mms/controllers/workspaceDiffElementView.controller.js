'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('WorkspaceDiffElementViewController', ["_", "$timeout", "$scope", "$rootScope", "$state", "$stateParams", "$modal", "growl", "WorkspaceService", "ElementService", "diff",
function(_, $timeout, $scope, $rootScope, $state, $stateParams, $modal, growl, WorkspaceService, ElementService, diff) {
    $scope.source = $stateParams.source;
    $scope.target = $stateParams.target;
    $scope.sourceTime = $stateParams.sourceTime;
    $scope.targetTime = $stateParams.targetTime;
    $scope.diff = diff;

    $scope.options = $rootScope.options;

    $scope.change = $rootScope.id2change[$stateParams.elementId];
}]);