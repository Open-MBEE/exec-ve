'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('MainCtrl', ['$scope', '$location', '$rootScope', '$state', '_', '$window', 'growl', '$http', 'URLService',
function($scope, $location, $rootScope, $state, _, $window, growl, $http, URLService) {
    $rootScope.mms_viewContentLoading = false;
    $rootScope.mms_treeInitial = '';
    $rootScope.mms_title = '';
    $rootScope.mms_footer = 'JPL/Caltech PROPRIETARY — Not for Public Release or Redistribution. No export controlled documents allowed on this server.';

    var host = $location.host();
    if ($location.host().indexOf('europaems') !== -1) {
        $rootScope.mms_footer = 'The technical data in this document is controlled under the U.S. Export Regulations, release to foreign persons may require an export authorization.';
    }
    $window.addEventListener('beforeunload', function(event) {
        if ($rootScope.veEdits && !_.isEmpty($rootScope.veEdits)) {
            var message = 'You may have unsaved changes, are you sure you want to leave?';
            event.returnValue = message;
            return message;
        }
    });

    // Per CMED-737, always check the login first, so we can authenticate into the server 
    // before making any more calls.
    /*$http.get(URLService.getCheckLoginURL())
    .success(function(data, status, headers, config) {
        // Do nothing
    }).error(function(data, status, headers, config) {
        // On error, re-load the page:
        // Note: this may not be needed b/c the browser will keep prompting for credentials till
        //       they are correct
        $state.reload();
    });*/


    $scope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        growl.error('Error: ' + error.message);
    });

    $rootScope.$on('$viewContentLoading', 
    function(event, viewConfig){ 
        if (viewConfig.view.controller === 'ViewCtrl')
            $rootScope.mms_viewContentLoading = true;
    });

    $rootScope.$on('$stateChangeSuccess', 
        function(event, toState, toParams, fromState, fromParams) {
        
            // set the initial tree selection
            if ($state.includes('workspaces') && !$state.includes('workspace.sites')) {
                if (toParams.tag !== undefined && toParams.tag !== 'latest')
                    $rootScope.mms_treeInitial = toParams.tag;
                else
                    $rootScope.mms_treeInitial = toParams.workspace;
            } else if ($state.current.name === 'workspace.site') {
                $rootScope.mms_treeInitial = toParams.site;
            } else if ($state.current.name === 'workspace.site.documentpreview') {
                $rootScope.mms_treeInitial = toParams.document;
            }else if ($state.includes('workspace.site.document') && ($state.current.name !== 'workspace.site.document.order')) {
                if (toParams.view !== undefined)
                    $rootScope.mms_treeInitial = toParams.view;
                else
                    $rootScope.mms_treeInitial = toParams.document;
            }
        }
    );
}]);