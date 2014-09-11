'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('doc', {
        url: '/workspaces/:ws/sites/:site/products/:docId/:time',
        resolve: {
            document: function($stateParams, ElementService) {
                return ElementService.getElement($stateParams.docId, false, $stateParams.ws, $stateParams.time);
            },
            site: function($stateParams, SiteService) {
                return SiteService.getSite($stateParams.site);
            },
            views: function($stateParams, ViewService) {
                return ViewService.getDocumentViews($stateParams.docId, false, $stateParams.ws, $stateParams.time, true);
            },
            time: function($stateParams) {
                return $stateParams.time;
            },
            snapshots: function($stateParams, ConfigService) {
                return ConfigService.getProductSnapshots($stateParams.docId, $stateParams.site, $stateParams.ws);
            },
            ws: function($stateParams) {
                return $stateParams.ws;
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-responsive="true" mms-site="{{site}}" mms-title="{{title}}" mms-type="View Editor" mms-go-to="true" mms-other-sites="true" mms-ws="{{ws}}"></mms-nav>',
                //template: '<mms-nav site="{{site}}" type="document"></mms-nav>',
                controller: function($scope, $stateParams, document, site, ws) {
                    $scope.site = site.name;
                    $scope.ws = ws;
                    if ($stateParams.time !== 'latest')
                        $scope.title = document.name + ' (' + $stateParams.time + ')';
                    else
                        $scope.title = document.name;
                    $scope.docweb = false;
                }
            },
            'pane-left': {
                templateUrl: 'partials/ve/pane-left.html',
                controller: 'NavTreeCtrl'
            },
            'pane-right': {
                templateUrl: 'partials/ve/pane-right.html',
                controller: 'ToolCtrl'
            },
            'toolbar-right': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }
        }
    })
    .state('doc.view', {
        url: '/view/:viewId',
        views: {
            'pane-center@': {
                templateUrl: 'partials/ve/pane-center.html',
                controller: 'ViewCtrl'
            }
        },
        resolve: {
            viewElements: function($stateParams, ViewService, time, ws) {
                return ViewService.getViewElements($stateParams.viewId, false, ws, time);
            }
        }
    })
    .state('doc.order', {
        url: '/order',
        views: {
            'pane-center@': {
                templateUrl: 'partials/ve/reorder-views.html',
                controller: 'ReorderCtrl'
            }
        }
    })
    .state('doc.all', {
        url: '/all',
        views: {
            'pane-center@': {
                templateUrl: 'partials/ve/full-doc.html',
                controller: 'FullDocCtrl'
            }
        }
    });
});
