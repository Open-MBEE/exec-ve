'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('mm', {
        url: '',
        resolve: {
            workspaces: function(WorkspaceService) {
                return WorkspaceService.getWorkspaces();
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="Model Manager" mms-ws="master" mms-config="latest"></mms-nav>'
            },
            'pane-center': {
                templateUrl: 'partials/mm/pane-center.html'
            },
            'pane-left': {
                templateUrl: 'partials/mm/pane-left.html',
                controller: 'WorkspaceTreeCtrl'
            },
            'pane-right': {
                templateUrl: 'partials/mm/pane-right.html',
                controller: function ($state) {
                    $state.go('mm.workspace', {ws: 'master'});
                }
            },
            'toolbar-right': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }            
        }
    })
    .state('mm.workspace', {
        url: '/workspace/:ws',
        resolve: {
            sites: function($stateParams, SiteService) {
                return SiteService.getSites();
            },
            type: function() {
                return 'Workspace';
            },
            element: function($stateParams, WorkspaceService) {
                return WorkspaceService.getWorkspace($stateParams.ws);
            }
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mm/pane-center.html',
                controller: function ($rootScope, $scope, $stateParams, sites) {
                    $scope.ws = $stateParams.ws;
                    $scope.sites = sites;
                    $scope.buttons = [];
                    $scope.config = 'latest';
                    $rootScope.tree_initial = $scope.ws;
                 }
            },
            'pane-right@': {
                templateUrl: 'partials/mm/pane-right.html',
                controller: 'ToolCtrl'
            }
        }
    })
    .state('mm.workspace.config', {
        url: '/tags/:config',
        resolve: {
            config: function($stateParams, ConfigService) {
                if ($stateParams.config === 'latest')
                    return 'latest';
                return ConfigService.getConfig($stateParams.config, $stateParams.ws, false);
            },
            timedSites: function($stateParams, SiteService, config) {
                if (config === 'latest')
                    return SiteService.getSites();
                return SiteService.getSites(config.timestamp);
            },
            type: function() {
                return 'Configuration';
            },
            element: function($stateParams, ConfigService) {
                return ConfigService.getConfig($stateParams.config, $stateParams.ws, false);
            }        
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mm/pane-center.html',
                controller: function($scope, $stateParams, timedSites) {
                    $scope.ws = $stateParams.ws;
                    $scope.config = $stateParams.config;
                    $scope.sites = timedSites;
                }
            },
            'pane-right@': {
                templateUrl: 'partials/mm/pane-right.html',
                controller: 'ToolCtrl'

            }
        }
    })
    .state('mm.diff', {
        url: '/diff/:source/:sourceTime/:target/:targetTime',
        resolve: {
            diff: function($stateParams, WorkspaceService) {
                return WorkspaceService.diff($stateParams.target, $stateParams.source, $stateParams.targetTime, $stateParams.sourceTime);
            }
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mm/diff-pane-center.html'
            },
            'pane-left@': {
                templateUrl: 'partials/mm/diff-pane-left.html',
                controller: 'WorkspaceDiffChangeController'
            },
            'pane-right@': {
                templateUrl: 'partials/mm/diff-pane-right.html',
                controller: 'WorkspaceDiffTreeController'
            }
        }
    })
    .state('mm.diff.view', {
        url: '/element/:elementId',
        resolve: {
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mm/diff-view-pane-center.html',
                controller: 'WorkspaceDiffElementViewController'
            }
        }
    });
});


