'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('diffPageModalCtrl', ["_", "$timeout", "$scope", "$rootScope", "$uibModal", "growl", "ElementService", "UxService", "$uibModalInstance", "$state", "WorkspaceService", "diff",
function(_, $timeout, $scope, $rootScope, $uibModal, growl, ElementService, UxService, $uibModalInstance, $state, WorkspaceService, diff) {

	$scope.diff = diff;
	
	if($scope.diff.status === 'GENERATING'){
		$scope.pane = 'diffInProgress';
		$scope.originator = $scope.diff.user;
		$scope.originatorEmail = $scope.diff.email;
		$scope.diffStartTime = $scope.diff.diffTime;
	} else if($scope.diff.status === 'OUTDATED'){
		$scope.pane = 'outdatedDiff';
	}

	$scope.startDiff = function(){
		$scope.source = $scope.diff.workspace2;
		$scope.dest = $scope.diff.workspace1;

		$scope.targetTime = 'latest';
		$scope.sourceTime = 'latest';
		$scope.sourceWsId = $scope.source.id;
		$scope.targetWsId = $scope.dest.id;

		if($scope.source.timestamp){
			$scope.sourceTime = $scope.source.timestamp;
		}
		if($scope.dest.timestamp){
			$scope.targetTime = $scope.dest.timestamp;
		}

		WorkspaceService.diff($scope.targetWsId, $scope.sourceWsId, $scope.targetTime, $scope.sourceTime, true)
		.then(function(data){
			if(data.status === 'COMPLETED'){
				$uibModalInstance.close();

				$state.go('workspace.diff', {
					source: $scope.sourceWsId,
					target: $scope.targetWsId,
					sourceTime: $scope.sourceTime,
					targetTime: $scope.targetTime
				});
			} else {
				$scope.pane = 'generating';
			}
		});
	};

	$scope.finished = function() {
		$uibModalInstance.close();
	};

}]);