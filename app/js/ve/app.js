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
                template: '<mms-nav mms-site="{{site}}" mms-title="{{title}}" mms-type="View Editor"></mms-nav>',
                //template: '<mms-nav site="{{site}}" type="document"></mms-nav>',
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
                controller: function($scope, $stateParams, $state, $rootScope, viewElements, ViewService, time, snapshots, site, document, growl, ConfigService) {
                    ViewService.setCurrentViewId($stateParams.viewId);
                    $rootScope.tree_initial_selection = $stateParams.viewId;
                    $scope.vid = $stateParams.viewId;
                    $scope.viewElements = viewElements;
                    $scope.showSpec = true;
                    $scope.version = time;
                    $scope.eid = $scope.vid;
                    $scope.document = document;
                    $scope.snapshots = snapshots;
                    $scope.editable = $scope.document.editable && time === 'latest';
                    $scope.site = site;
                    $scope.time = time;
                    $scope.tscClicked = function(elementId) {
                        $scope.eid = elementId;      //$state.go('view.element', {elementId: elementId});
                        $scope.showSpec = true;
                        $scope.$apply();
                    };
                    $scope.createNewSnapshot = function() {
                        ConfigService.createSnapshot($scope.document.sysmlid)
                        .then(function(result) {
                            growl.success("Create Successful: wait for email.");
                        }, function(reason) {
                            growl.error("Create Failed: " + reason.message);
                        });
                    };
                    $scope.refreshSnapshots = function() {
                        ConfigService.getProductSnapshots($scope.document.sysmlid, $scope.site.name, 'master', true)
                        .then(function(result) {
                        }, function(reason) {
                            growl.error("Refresh Failed: " + reason.message);
                        });
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
