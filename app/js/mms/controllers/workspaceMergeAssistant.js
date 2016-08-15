'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('WorkspaceMergeAssistant', ["_", "$timeout", "$scope", "$rootScope", "$uibModal", "growl", "ElementService", "UxService", "$uibModalInstance", "$state", "WorkspaceService",
function(_, $timeout, $scope, $rootScope, $uibModal, growl, ElementService, UxService, $uibModalInstance, $state, WorkspaceService) {

    $scope.pane = $rootScope.mergeInfo.pane;
    $scope.pane = $rootScope.mergeInfo.pane;
    
    // Setting default to custom merge. Will be set by user once "quick" merge is available
    $scope.mergeInfo.type = 'custom';
    
    $scope.mergeAssistFromTo = function(type)
    {
	    $scope.mergeInfo.type = type;
	    
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
	    var source = $scope.mergeInfo.source.branch;
	    var dest = $scope.mergeInfo.dest.branch;
	    
	    var targetTime = 'latest';
	    var sourceTime = 'latest';
	    var sourceWsId = source.data.id;
	    var targetWsId = dest.data.id;
	    
	    // If source or destination is a tag, use timestamps instead
	    if(source.type === "configuration")
	    {
		    sourceWsId = source.workspace;
		    sourceTime = source.data.timestamp;
	    }
	    if(dest.type === "configuration")
	    {
		    targetWsId = dest.workspace;
		    targetTime = dest.data.timestamp;
	    }
	    
	    WorkspaceService.diff(targetWsId, sourceWsId, targetTime, sourceTime)
        .then(function(data)
        {   
            if(data.status === 'COMPLETED')
            {
	            // Close modal
	            $uibModalInstance.close();
	            
	            // Redirect to diffs page
	            $state.go('workspace.diff', {
		            source: sourceWsId,
		            target: targetWsId,
		            sourceTime: sourceTime,
		            targetTime: targetTime
	            });
            } else if(data.status === 'GENERATING') {
		        $scope.pane = 'diffInProgress';
                $scope.originator = data.user;
                $scope.originatorEmail = data.email;
                $scope.diffStartTime = data.diffTime;
	        } else if(data.status === "OUTDATED") {
		        WorkspaceService.diff(targetWsId, sourceWsId, targetTime, sourceTime, true)
                .then(function(data) {
			         $scope.pane = 'generating';
		        });
	        } else if (data.status === 'STARTED')
                $scope.pane = 'generating';
        },
        function(data)
        {
	        // @TODO Error handling goes here
        });
    };
    
    // @TODO
    $scope.mergeAssistCancelConfirm = function()
    {
	    // Provide cancellation functionality
	    var dmCancelModal = $uibModal.open({
		    controller: 'WorkspaceMergeAssistant',
		    size: 'sm',
		    templateUrl: 'partials/mms/merge_assistant-cancel.html'
	    });
    };
    
    $scope.finished = function()
    {
	    $uibModalInstance.close();
    };
    
}]);