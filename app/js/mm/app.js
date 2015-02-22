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
                template: '<mms-nav mms-title="Model Manager"></mms-nav>'
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
            },
            wsCoverDoc : function($stateParams, ElementService, growl) {
            
                // This is a short-term work-around -- all this should be done the back-end MMS in the future
                var wsCoverDocId = 'master_cover';

                return ElementService.getElement(wsCoverDocId, false, $stateParams.ws, 'latest')
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if (reason.status !== 404) return null;

                    var doc = {
                        specialization: {type: "View"},
                        name: 'Workspace Cover Page',
                        documentation: ''
                    };
                    doc.sysmlid = wsCoverDocId;
                    doc.specialization.contains = [
                        {
                            'type': 'Paragraph',
                            'sourceType': 'reference',
                            'source': wsCoverDocId,
                            'sourceProperty': 'documentation'
                        }
                    ];
                    doc.specialization.allowedElements = [wsCoverDocId];
                    doc.specialization.displayedElements = [wsCoverDocId];
                    doc.specialization.childrenViews = [];

                    return ElementService.createElement(doc, $stateParams.ws, null)
                    .then(function(data) {
                        // growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                }).finally(function(){
                    return null;
                });

            }            
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mm/pane-center.html',
                controller: function ($rootScope, $scope, $stateParams, sites, wsCoverDoc) {
                    $scope.ws = $stateParams.ws;
                    $scope.sites = sites;
                    $scope.buttons = [];
                    $scope.config = 'latest';
                    $rootScope.tree_initial = $scope.ws;
                    $scope.wsCoverDoc = wsCoverDoc;
                    $scope.time = 'latest';
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
            }, 
            wsCoverDoc : function($stateParams, ElementService, config, growl) {
            
                // This is a short-term work-around -- all this should be done the back-end MMS in the future
                var wsCoverDocId = 'master_cover';

                return ElementService.getElement(wsCoverDocId, false, $stateParams.ws, config.timestamp)
                .then(function(data) {
                    return data;
                }, function(reason) {
                    return null;
                }).finally(function(){
                    return null;
                });
            } 
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mm/pane-center.html',
                controller: function($scope, $stateParams, timedSites, wsCoverDoc, config) {
                    $scope.ws = $stateParams.ws;
                    $scope.config = $stateParams.config;
                    $scope.sites = timedSites;
                    $scope.wsCoverDoc = wsCoverDoc;
                    $scope.time = config.timestamp;  
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


