'use strict';

angular.module('mm', ['ui.router', 'mms', 'mms.directives', 'ui.bootstrap', 'ui.tree', 'fa.directive.borderLayout'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('main', {
        url: '',
        resolve: {
            workspaces: function(WorkspaceService) {
                return WorkspaceService.getAll();
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
                }
            }
        }
    })    
    .state('main.diff', {
        url: '/diff/:source/:target',
        resolve: {
            diff: function($stateParams, WorkspaceService) {
                return WorkspaceService.diff($stateParams.source, $stateParams.target);
            }
        },
        views: {
            'main@': {
                templateUrl: 'partials/mm/diff.html',
                controller: 'DiffTreeController'
            }
        }
    });
});
