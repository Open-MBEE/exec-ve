'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('portal', {
        url: '/workspaces/:ws',
        resolve: {
            sites: function($stateParams, SiteService) {
                return SiteService.getSites($stateParams.ws);
            },
            ws: function($stateParams) {
                return $stateParams.ws;
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="Portal" mms-ws="{{ws}}"></mms-nav>',
                controller: function($scope, $stateParams, ws) {
                    $scope.ws = ws;
                }
            },
            'pane-center': {
                templateUrl: 'partials/portal/pane-center.html',
                controller: 'PortalCtrl'
            },
            'pane-left': {
                templateUrl: 'partials/portal/pane-left.html',
                controller: 'NavTreeCtrl'
            },
            'pane-right': {
                templateUrl: 'partials/portal/pane-right.html'
            },
            'toolbar-right': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }            
        }
    })
    .state('portal.site', {
        url: '/site/:site',
        resolve: {
            documents: function($stateParams, ViewService) {
                return ViewService.getSiteDocuments($stateParams.site, null, $stateParams.ws, null);
            }
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/portal/pane-center.html',
                controller: function ($scope, $stateParams, documents) {
                    $scope.ws = $stateParams.ws;
                    $scope.site = $stateParams.site;
                    $scope.documents = documents;
                    $scope.buttons = [];
                 }
            }
        }
    });
});


