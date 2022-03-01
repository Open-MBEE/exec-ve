import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');


/* Controllers */

mmsApp.controller('MainCtrl', ['$scope', '$timeout', '$location', '$state', '$window', '$uibModal', 'growl', '$http', 'URLService', 'hotkeys', 'growlMessages', 'UtilsService', 'HttpService', 'AuthService', 'ElementService', 'CacheService', 'ApplicationService', 'RootScopeService', 'EditService', 'EventService', '$interval',
function($scope, $timeout, $location, $state, $window, $uibModal, growl, $http, URLService, hotkeys, growlMessages, UtilsService, HttpService, AuthService, ElementService, CacheService, ApplicationService, RootScopeService, EditService, EventService, $interval) {
    var _ = $window._;
    var rootScopeSvc = RootScopeService;
    var edit = EditService;
    var eventSvc = EventService;
    eventSvc.$init($scope);

    var openEdits = {};

    rootScopeSvc.veViewContentLoading(false);
    rootScopeSvc.treeInitialSelection('');

    $scope.subs.push(eventSvc.$on(rootScopeSvc.constants.VETITLE, (value) => {
        $window.document.title = value + ' | View Editor';
    }));



    rootScopeSvc.veFn(false);

    var modalOpen = false;

    $scope.subs.push(eventSvc.$on(edit.EVENT, () => {
        openEdits = edit.getAll();
    }));


    $window.addEventListener('beforeunload', function(event) {
        if (Object.keys(openEdits).length > 0) {
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
        let data = {
            event: event,
            toState: toState,
            toParams: toParams,
            fromState: fromState,
            fromParams: fromParams,
            error: error
        }
        eventSvc.$broadcast('$stateChangeError', data)
    });

    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        let data = {
            event: event,
            toState: toState,
            toParams: toParams,
            fromState: fromState,
            fromParams: fromParams
        }
        eventSvc.$broadcast('$stateChangeStart', data)
    });

    $scope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
            let data = {
                event: event,
                toState: toState,
                toParams: toParams,
                fromState: fromState,
                fromParams: fromParams
            }
            eventSvc.$broadcast('$stateChangeSuccess', data)
        }
    );

   $scope.subs.push(eventSvc.$on('mms.unauthorized', function(response) {
        // add a boolean to the 'or' statement to check for modal window
        if ($state.$current.name === 'login' || rootScopeSvc.veStateChanging() || modalOpen)
            return;
        AuthService.checkLogin().then(function(){}, function() {
            if ($state.$current.name === 'login' || modalOpen)
                return;
            modalOpen = true;
            $uibModal.open({
                template: '<div class="modal-header"><h4>You have been logged out, please login again.</h4></div><div class="modal-body"><form name="loginForm" ng-submit="login(credentials)">' +
                                '<input type="text" class="form-control" ng-model="credentials.username" placeholder="Username" style="margin-bottom: 1.5em;" autofocus>' +
                                '<input type="password" class="form-control" ng-model="credentials.password" placeholder="Password" style="margin-bottom: 1.5em;">' +
                                '<button class="btn btn-block btn-primary" type="submit">LOG IN <span ng-if="spin" ><i class="fa fa-spin fa-spinner"></i>' +
                            '</span></button></form></div>',
                scope: $scope,
                backdrop: 'static',
                controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                    $scope.credentials = {
                        username: '',
                        password: ''
                    };
                    $scope.spin = false;
                    $scope.login = function (credentials) {
                        $scope.spin = true;
                        var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                        AuthService.getAuthorized(credentialsJSON).then(function (user) {
                            growl.success("Logged in");
                            $uibModalInstance.dismiss();
                            // Check if user had changes queued before refreshing page data
                            // add edits to cache
                            var edits = edit.getAll();
                            _.map(edits, function(element, key) {
                                var cacheKey = UtilsService.makeElementKey(element, true);
                                CacheService.put(cacheKey, element);
                            });
                            $state.go($state.current, {}, {reload: true});
                        }, function (reason) {
                            $scope.spin = false;
                            $scope.credentials.password = '';
                            growl.error(reason.message);
                        });
                    };
                }],
                size: 'md'
            }).result.finally(function(){
                modalOpen = false;
            });
        });
    }));
    // broadcast mms.unauthorized every 10 minutes with interval service
    $interval(function() {
        eventSvc.$broadcast('mms.unauthorized');
    }, 600000, 0, false);

    $scope.subs.push(eventSvc.$on('$stateChangeError', (data) => {
        rootScopeSvc.veStateChanging(false);
        rootScopeSvc.veViewContentLoading(false);
        //check if error is ticket error
        if (!data.error || data.error.status === 401 ||
            (data.error.status === 404 && data.error.config && data.error.config.url &&
                data.error.config.url.indexOf('/authentication') !== -1)) { //check if 404 if checking valid ticket
            data.event.preventDefault();
            rootScopeSvc.veRedirect({toState: data.toState, toParams: data.toParams});
            $state.go('login', {notify: false});
            return;
        }
        growl.error('Error: ' + data.error.message);
    }));

    $scope.subs.push(eventSvc.$on('$stateChangeStart', (data) => {
        rootScopeSvc.veViewContentLoading(true);
        HttpService.transformQueue();
        rootScopeSvc.veStateChanging(true);
    }));

    $scope.subs.push(eventSvc.$on('$stateChangeSuccess', (data) => {
        rootScopeSvc.veStateChanging(false);
        $scope.hidePanes = false;
        $scope.showManageRefs = false;
        $scope.showLogin = false;
        if ($state.current.name === 'login' || $state.current.name === 'login.select' || $state.current.name === 'login.redirect') {
            $scope.hidePanes = true;
            $scope.showLogin = true;
        } else if ( $state.includes('project') && !($state.includes('project.ref')) ) {
            $scope.hidePanes = true;
            $scope.showManageRefs = true;
            eventSvc.$broadcast('fromParamChange', data.fromParams);
        }
        if ($state.current.name === 'project.ref') {
            rootScopeSvc.treeInitialSelection(data.toParams.refId);
        } else if ($state.current.name === 'project.ref.preview') {
            var index = data.toParams.documentId.indexOf('_cover');
            if (index > 0)
                rootScopeSvc.treeInitialSelection(data.toParams.documentId.substring(5, index));
            else
                rootScopeSvc.treeInitialSelection(data.toParams.documentId);
        } else if ($state.includes('project.ref.document') && ($state.current.name !== 'project.ref.document.order')) {
            if (data.toParams.viewId !== undefined)
                rootScopeSvc.treeInitialSelection(data.toParams.viewId);
            else
                rootScopeSvc.treeInitialSelection(data.toParams.documentId);
        }
        if ($state.includes('project.ref.document')) {
            ApplicationService.getState().inDoc = true;
            ApplicationService.getState().currentDoc = data.toParams.documentId;
            if ($state.includes('project.ref.document.full')) {
                ApplicationService.getState().fullDoc = true;
            } else {
                ApplicationService.getState().fullDoc = false;
            }
        } else {
            ApplicationService.getState().inDoc = false;
            ApplicationService.getState().fullDoc = false;
        }
        rootScopeSvc.veViewContentLoading(false);
        if ($state.includes('project.ref') && (data.fromState.name === 'login' || data.fromState.name === 'login.select' || data.fromState.name === 'project' || data.fromState.name === 'login.redirect')) {
            $timeout(function() {
                eventSvc.$broadcast('tree-pane-toggle');
            }, 1, false);
            $timeout(function() {
                eventSvc.$broadcast('tree-pane-toggle');
            }, 100, false);
        }
    }));

    var workingModalOpen = false;
   $scope.subs.push(eventSvc.$on('mms.working', function(response) {
        rootScopeSvc.veViewContentLoading(false);
        if (workingModalOpen) {
            return;
        }
        $scope.mmsWorkingTime = response.data;
        workingModalOpen = true;
        $uibModal.open({
            template: "<div class=\"modal-header\">Please come back later</div><div class=\"modal-body\">The document you're requesting has been requested already at {{mmsWorkingTime.startTime | date:'M/d/yy h:mm a'}} and is currently being cached, please try again later.</div>",
            scope: $scope,
            backdrop: true,
            controller: ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                }],
            size: 'md'
        }).result.finally(function(){
            workingModalOpen = false;
        });
    }));

   $scope.subs.push(eventSvc.$on('element.updated', function(data) {
        let element = data.element;
        //if element is not being edited and there's a cached edit object, update the edit object also
        //so next time edit forms will show updated data (mainly for stomp updates)
        var editKey = UtilsService.makeElementKey(element, true);
        var veEditsKey = element.id + '|' + element._projectId + '|' + element._refId;
        if (edit.getAll() && !edit.get(veEditsKey) && CacheService.exists(editKey)) {
            ElementService.cacheElement({projectId: element._projectId, refId: element._refId, elementId: element.id, commitId: 'latest'}, JSON.parse(JSON.stringify(element)), true);
        }
    }));
}]);
