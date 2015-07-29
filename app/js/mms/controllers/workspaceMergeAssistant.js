'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('WorkspaceMergeAssistant', ["_", "$timeout", "$scope", "$rootScope", "$modal", "growl", "ElementService", "UxService", "$modalInstance", "$state",
function(_, $timeout, $scope, $rootScope, $modal, growl, ElementService, UxService, $modalInstance, $state) {
    
    var sourceId = $scope.mergeInfo.branch.data.id;
    var targetId = $scope.mergeInfo.parentBranch.data.id;
    
    $scope.mergeAssistFromTo = function(type)
    {
	    $scope.mergeInfo.type = type;
	    
	    $scope.mergeInfo.source = 'foo';
	    $scope.mergeInfo.dest = 'bar';
	    
	    // @TODO Verify that both source and destination are selected
	    
	    // Call up "from/to" modal
	    $modalInstance.close();
	    $modal.open({
		    templateUrl: 'partials/mms/merge_assistant-from_to_chooser.html',
		    size: 'sm',
		    controller: 'WorkspaceMergeAssistant'
	    });
    };
    
    $scope.mergeAssistConfirmation = function(source, dest)
    {
	    // @TODO Show cancel confirmation if user clicks outside of modal
	    
	    var diffCompleted = false;
	    var diffInProgress = false;
	    
	    // Check to see if the diff has already completed
	    if(diffCompleted === true)
	    {
		    // @TODO If the diff has already completed, send user to diff
		    var sourceId = $scope.mergeFrom.data.id;
	        var sourceTime = 'latest';
	        
	        if ($scope.mergeFrom.type === 'configuration') {
	            sourceId = $scope.mergeFrom.workspace;
	            sourceTime = $scope.mergeFrom.data.timestamp;
	        }
	        var targetId = $scope.mergeTo.data.id;
	        var targetTime = 'latest';
	        
	        if ($scope.mergeTo.type === 'configuration') {
	            targetId = $scope.mergeTo.workspace;
	            targetTime = $scope.mergeTo.data.timestamp;
	        }
	        
		    $state.go('workspace.diff', {source: sourceId, target: targetId, sourceTime: sourceTime, targetTime: targetTime});
	    }
	    
	    // @TODO Check to see if the diff is currently in progress
	    if(diffInProgress === true)
	    {
		    // If in progress, tell the view to show the "in progress" text
		    $scope.mergeInfo.inProgress = true;
		    // @TODO find user who started this dynamically
		    $scope.mergeInfo.startedBy = "Brad";
	    }
	    
	    
	    // If no diff exists, show confirmation dialogue
	    $modalInstance.close();
	    
	    $modal.open({
		    templateUrl: 'partials/mms/merge_assistant-confirmation.html',
		    size: 'sm',
		    controller: 'WorkspaceMergeAssistant'
	    });
    };
    
    // @TODO
    $scope.mergeAssistCancelConfirm = function()
    {
	    // Provide cancellation functionality
	    var dmCancelModal = $modal.open({
		    controller: 'WorkspaceMergeAssistant',
		    size: 'sm',
		    templateUrl: 'partials/mms/merge_assistant-cancel.html'
	    });
    };
    
}]);