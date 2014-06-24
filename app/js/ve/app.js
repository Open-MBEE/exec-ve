'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('doc', {
        url: '/sites/:site/products/:docId/:time',
        resolve: {
            document: function($stateParams, ElementService) {
                return ElementService.getElement($stateParams.docId, false, 'master', $stateParams.time);
            },
            site: function($stateParams, SiteService) {
                return SiteService.getSite($stateParams.site);
            },
            views: function($stateParams, ViewService) {
                return ViewService.getDocumentViews($stateParams.docId, false, 'master', $stateParams.time);
            },
            time: function($stateParams) {
                return $stateParams.time;
            },
            snapshots: function($stateParams, ConfigService) {
                return ConfigService.getProductSnapshots($stateParams.docId, $stateParams.site, 'master');
            }
        },
        views: {
            'menu': {
                template: '<mms-nav site="{{site}}" title="{{title}}" type="document"></mms-nav>',
                controller: function($scope, $stateParams, document, site, views) {
                    $scope.site = site.name;
                    if ($stateParams.time !== 'latest')
                        $scope.title = document.name + ' (' + $stateParams.time + ')';
                    else
                        $scope.title = document.name;
                    $scope.docweb = false;
                }
            },
            'sidebar-left': {
                templateUrl: 'partials/ve/sidebar-left.html',
                controller: 'NavTreeCtrl'
            }
        }
    })
    .state('doc.view', {
        url: '/view/:viewId',
        views: {
            'view@': {
                templateUrl: 'partials/ve/view.html',
                controller: function($scope, $stateParams, $state, $rootScope, viewElements, ViewService, time) {
                    ViewService.setCurrentViewId($stateParams.viewId);
                    $rootScope.tree_initial_selection = $stateParams.viewId;
                    $scope.vid = $stateParams.viewId;
                    $scope.viewElements = viewElements;
                    $scope.showSpec = false;
                    $scope.version = time;
                    $scope.tscClicked = function(elementId) {
                        $scope.eid = elementId;
                        $scope.showSpec = true;
                        $scope.$apply();
                    };
                }
            }
        },
        resolve: {
            viewElements: function($stateParams, ViewService, time) {
                return ViewService.getViewElements($stateParams.viewId, false, 'master', time);
            }
        }
    })
    .state('doc.order', {
        url: '/order',
        views: {
            'view@': {
                templateUrl: 'partials/ve/reorder-views.html',
                controller: 'ReorderCtrl'
            }
        }
    });
});
