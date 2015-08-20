'use strict';

angular.module('mmsApp')
.controller('cancelModalCtrl', ["_", "$timeout", "$scope", "$rootScope", "$modal", "$modalInstance", "$state",
function(_, $timeout, $scope, $rootScope, $modal, $modalInstance, $state){

	$scope.close = function(){
		$modalInstance.close();
	};

	$scope.exit = function(){
		$state.go('workspace', {}, {reload:true});
		$modalInstance.close();	
	};

}]);