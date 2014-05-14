'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('doc', {
        url: '/sites/:site/products/:docId/:time',
        resolve: {
            document: function($stateParams, ElementService) {
                return ElementService.getElement($stateParams.docId);
            },
            site: function($stateParams, SiteService) {
                return SiteService.getSite($stateParams.site);
            }
        },
        views: {
            'menu': {
                template: '<mms-nav site="{{site}}" title="{{title}}"></mms-nav>',
                controller: function($scope, $stateParams, document, site) {
                    $scope.site = site.title;
                    $scope.title = document.name;
                }
            },
            'sidebar': {
                templateUrl: 'partials/sidebar.html',
                controller: 'NavTreeCtrl'
            }
        }

    })
    .state('doc.view', {
        url: '/view/:viewId',
        views: {
            'view@': {
                templateUrl: 'partials/view.html',
                controller: function($scope, $stateParams, $state, viewElements) {
                    $scope.vid = $stateParams.viewId;
                    $scope.viewElements = viewElements;
                    $scope.tscClicked = function(elementId) {
                        $scope.eid = elementId;      //$state.go('view.element', {elementId: elementId});
                        $scope.$apply();
                    };
                }
            }
        },
        resolve: {
            viewElements: function($stateParams, ViewService) {
                return ViewService.getViewAllowedElements($stateParams.viewId);
            }
        }
    })
});
