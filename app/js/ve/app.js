'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.rule(function ($injector, $location) {
        // default to workspace - master if url is old format
        if ($location.path().indexOf('/workspaces') === -1)
        {
            var workspacePath = 'workspaces/master' + $location.path();
            $location.path(workspacePath);
        }
    });

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
            views: function($stateParams, ViewService, document) {
                if (document.specialization.type !== 'Product')
                    return [];
                return ViewService.getDocumentViews($stateParams.docId, false, $stateParams.ws, $stateParams.time, true);
            },
            time: function($stateParams) {
                return $stateParams.time;
            },
            snapshots: function($stateParams, ConfigService, document) {
                if (document.specialization.type !== 'Product')
                    return [];
                return ConfigService.getProductSnapshots($stateParams.docId, $stateParams.site, $stateParams.ws);
            },
            ws: function($stateParams) {
                return $stateParams.ws;
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="View Editor" mms-ws="{{ws}}" mms-site="{{site}}" mms-doc="document" mms-config="{{config}}" mms-snapshot-tag="{{snapshotTag}}"></mms-nav>',
                controller: function($scope, $stateParams, $filter, document, site, snapshots, time, ws) {
                    var tag = '';
                    if (time !== 'latest') {
                        snapshots.forEach(function(snapshot) {
                            if (time === snapshot.created && snapshot.configurations && snapshot.configurations.length > 0)
                                snapshot.configurations.forEach(function(config) {
                                    tag += '(' + config.name + ') ';
                                    $scope.config = config.id;
                                });
                        });
                        tag += '(' + $filter('date')(time, 'M/d/yy h:mm a') + ')';
                    } else {
                        $scope.config = 'latest';
                    }
                    
                    $scope.ws = ws;
                    $scope.site = site.sysmlid;
                    $scope.document = document;
                    if ($stateParams.time !== 'latest')
                        $scope.snapshotTag = ' ' + tag;

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
            },
            view: function($stateParams, ViewService, time, ws, viewElements) {
                return ViewService.getView($stateParams.viewId, false, ws, time);
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
