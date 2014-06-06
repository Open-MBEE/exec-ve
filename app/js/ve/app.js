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
            }
        },
        views: {
            'menu': {
                template: '<mms-nav site="{{site}}" title="{{title}}" type="document"></mms-nav>',
                controller: function($scope, $stateParams, document, site, views) {
                    $scope.site = site.title;
                    $scope.title = document.name;
                    $scope.docweb = false;
                }
            },
            'sidebar': {
                templateUrl: 'partials/ve/sidebar.html',
                controller: 'NavTreeCtrl'
            }
        }
    })
    .state('doc.view', {
        url: '/view/:viewId',
        views: {
            'view@': {
                templateUrl: 'partials/ve/view.html',
                controller: function($scope, $stateParams, $state, viewElements, ViewService) {
                    ViewService.setCurrentViewId($stateParams.viewId);
                    $scope.vid = $stateParams.viewId;
                    $scope.viewElements = viewElements;
                    $scope.showSpec = false;
                    $scope.tscClicked = function(elementId) {
                        $scope.eid = elementId;      //$state.go('view.element', {elementId: elementId});
                        $scope.showSpec = true;
                        $scope.$apply();
                    };
                }
            }
        },
        resolve: {
            viewElements: function($stateParams, ViewService) {
                return ViewService.getViewElements($stateParams.viewId, false, 'master', $stateParams.time);
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
