'use strict';

/* Controllers */

angular.module('mmsApp')
.controller('MainCtrl', ['$scope', '$location', '$rootScope', '$state', '_', '$window', '$modal', 'growl', '$http', 'URLService', 'hotkeys', 'growlMessages', 'StompService', 'UtilsService', 'HttpService', 'AuthorizationService',
function($scope, $location, $rootScope, $state, _, $window, $modal, growl, $http, URLService, hotkeys, growlMessages, StompService, UtilsService, HttpService, AuthorizationService) {
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

    hotkeys.bindTo($scope)
        .add({
            combo: 'alt+m',
            description: 'close all messages',
            callback: function() {growlMessages.destroyAllMessages();}
        }).add({
            combo: '@',
            description: 'fast cf in editor',
            callback: function() {}
        });

    $scope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        $rootScope.mms_stateChanging = false;
        $rootScope.mms_viewContentLoading = false;
        //check if error is ticket error
        if (!error || error.status === 401 || (error.status === 404 && error.config && error.config.url && error.config.url.indexOf('/login/ticket') !== -1)) { //check if 404 if checking valid ticket
            event.preventDefault();
            $rootScope.mmsRedirect = {toState: toState, toParams: toParams};
            $state.go('login', {notify: false});
            return;
        }
        growl.error('Error: ' + error.message);
    });

    /*$rootScope.$on('$viewContentLoading', 
    function(event, viewConfig){ 
        if (viewConfig.view.controller === 'ViewCtrl')
            $rootScope.mms_viewContentLoading = true;
    });*/

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
        $rootScope.mms_viewContentLoading = true;
        HttpService.transformQueue();
        $rootScope.mms_stateChanging = true;
        // if (!AuthorizationService.getTicket() && toState.name !== 'login') {
        //     event.preventDefault();
        //     $rootScope.mmsRedirect = {toState: toState, toParams: toParams};
        //     //$location.url('/login');
        //     $state.go('login', {notify: false});
        // }
    });
    
    $rootScope.$on("mms.unauthorized", function(event, response) {
        if ($state.$current.name === 'login' || $rootScope.mms_stateChanging)
            return;
        AuthorizationService.checkLogin().then(function(){}, function() {
            var instance = $modal.open({
                template: '<div class="modal-header">You have been looged out, login again.</div><div class="modal-body"><form name="loginForm" ng-submit="login(credentials)">' + 
                                '<input type="text" class="form-control" ng-model="credentials.username" placeholder="Username">' + 
                                '<input type="password" class="form-control" ng-model="credentials.password" placeholder="Password">' + 
                                '<button class="btn btn-block" type="submit">LOG IN <span ng-if="spin" ><i class="fa fa-spin fa-spinner"></i>' + 
                            '</span></button></form></div>',
                scope: $scope,
                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                    $scope.credentials = {
                      username: '',
                      password: ''
                    };
                    $scope.spin = false;
                    $scope.login = function (credentials) {
                        $scope.spin = true;
                        var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                            AuthorizationService.getAuthorized(credentialsJSON).then(function (user) {
                                growl.success("Logged in");
                                $modalInstance.dismiss();
                            }, function (reason) {
                                $scope.spin = false;
                                growl.error(reason.message);
                            });
                        };
                    }],
                size: 'md'
            });
        });
    });

    //actions for stomp checking edit mode
    $scope.$on("stomp.element", function(event, deltaSource, deltaWorkspaceId, deltaElementID, deltaModifier, deltaName){
        if($rootScope.veEdits && $rootScope.veEdits['element|' + deltaElementID + '|' + deltaWorkspaceId] === undefined){
            UtilsService.mergeElement( deltaSource, deltaElementID, deltaWorkspaceId , true , "all" );
        }
    });
    $rootScope.$on('$stateChangeSuccess', 
        function(event, toState, toParams, fromState, fromParams) {
            $rootScope.mms_stateChanging = false;
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
            $rootScope.mms_viewContentLoading = false;
        }
    );
    
}]);
