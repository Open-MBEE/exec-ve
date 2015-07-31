'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('WorkspaceMergeAssistant', ["_", "$timeout", "$scope", "$rootScope", "$modal", "growl", "ElementService", "UxService", "$modalInstance", "$state", "WorkspaceService",
function(_, $timeout, $scope, $rootScope, $modal, growl, ElementService, UxService, $modalInstance, $state, WorkspaceService) {
    
    var sourceWsId = $scope.mergeInfo.branch.data.id;
    var targetWsId = $scope.mergeInfo.parentBranch.data.id;
    
    $scope.pane = $rootScope.mergeInfo.pane;
    
    // Setting default to custom merge. Will be set by user once "quick" merge is available
    $scope.mergeInfo.type = 'custom';
    
    $scope.mergeAssistFromTo = function(type)
    {
	    $scope.mergeInfo.type = type;
	    
	    // @TODO @REMOVE This are just test variables
	    $scope.mergeInfo.source = 'foo';
	    $scope.mergeInfo.dest = 'bar';
	    
	    // @TODO Verify that both source and destination are selected
	    
	    // Call up "from/to" modal
	    $scope.pane = 'fromToChooser';
    };

    $scope.mergeAssistConfirmation = function(source, dest)
    {
	    $scope.pane = 'beginMerge';
    };
    
    // @TODO Show cancel confirmation if user clicks outside of modal
    
    $scope.startDiff = function()
    {
	    var targetTime = 'latest';
	    var sourceTime = 'latest';
	    
	    WorkspaceService.diff(targetWsId, sourceWsId, targetTime, sourceTime)
        .then(function(data)
        {   
            // @TODO @REMOVE
            console.log(data);
            
            if(data.status === 'COMPLETED')
            {
	            console.info('Status supposedly completed. Status:');
	            console.log(data.status);
	            
	            // Close modal
	            $modalInstance.close();
	            
	            // Redirect to diffs page
	            $state.go('workspace.diff', {
		            source: sourceWsId,
		            target: targetWsId,
		            sourceTime: sourceTime,
		            targetTime: targetTime
	            });
            }
            
            if(data.status === 'GENERATING' || data.status === "OUTDATED")
            {
	            if(data.status === 'GENERATING')
	            {
		            $scope.pane = 'generating';
	            }
	            else if(data.status === "OUTDATED")
	            {
		            WorkspaceService.diff(targetWsId, sourceWsId, targetTime, sourceTime, true).then(function(data)
		            {
			            $scope.pane = 'generating';
		            });
	            }
            }
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
    
    $scope.finished = function()
    {
	    $modalInstance.close();
    };
    
}]);