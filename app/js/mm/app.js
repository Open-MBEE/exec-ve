'use strict';

angular.module('mm', ['ui.router', 'mms', 'mms.directives', 'ui.bootstrap', 'ui.tree', 'fa.directive.borderLayout'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('main', {
        url: '',
        resolve: {
            workspaces: function(WorkspaceService) {
                return WorkspaceService.getWorkspaces();
            },
        },
        views: {
            'menu': {
                template: '<mms-nav mms-type="Model Manager" mms-go-to="false" mms-other-sites="false"></mms-nav>'
            },
            'main': {
                templateUrl: 'partials/mm/main.html',
                controller: function($scope, workspaces) {
                    $scope.workspaces = workspaces;

                    var workspaces_groupByParent = {};

                    workspaces.forEach(function (workspace) {
                        if (workspace.id === 'master') return;
                        
                        if (! workspaces_groupByParent.hasOwnProperty(workspace.parent)) {
                            workspaces_groupByParent[workspace.parent] = [];
                        }

                        workspaces_groupByParent[workspace.parent].push(workspace);
                    });

                    $scope.workspaces_groupByParent_keys = Object.keys(workspaces_groupByParent);
                    $scope.workspaces_groupByParent = workspaces_groupByParent;

                    $scope.merge_state = {};
                    $scope.merge_state.pickA = true;
                    $scope.merge_state.pickB = false;
                    $scope.merge_state.merge = false;

                    $scope.cancelPick = function () {
                        $scope.merge_state.pickA = true;
                        $scope.merge_state.pickB = false;
                        $scope.merge_state.merge = false;
                        $scope.merge_state.A = "";
                        $scope.merge_state.B = "";
                    };

                    $scope.pickA = function (workspace) {
                        $scope.merge_state.pickA = false;
                        $scope.merge_state.pickB = true;
                        $scope.merge_state.merge = false;
                        $scope.merge_state.A = workspace;
                    };

                    $scope.pickB = function (workspace) {
                        $scope.merge_state.pickA = false;
                        $scope.merge_state.pickB = false;
                        $scope.merge_state.merge = true;
                        $scope.merge_state.B = workspace;
                    };

                }
            }
        }
    })    
    .state('main.diff', {
        url: '/diff/:source/:target',
        resolve: {
            /*diff: function($stateParams, WorkspaceService) {
                return WorkspaceService.diff($stateParams.source, $stateParams.target);
            }*/
        },
        views: {
            'main@': {
                templateUrl: 'partials/mm/diff.html',
                controller: 'DiffTreeController'
            }
        }
    })
    .state('main.diff.view', {
        url: '/element/:elementId',
        resolve: {
        },
        views: {
            'view@main.diff': {
                templateUrl: 'partials/mm/diff-view.html',
                controller: 'DiffViewController'
            }
        }
    });
});
