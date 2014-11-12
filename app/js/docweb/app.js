'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('portal', {
        url: '/workspaces/:ws/sites/:site',
        resolve: {
            site: function($stateParams, SiteService) {
                return SiteService.getSite($stateParams.site);
            },
            configs: function($stateParams, ConfigService) {
                return ConfigService.getSiteConfigs($stateParams.site, $stateParams.ws);
            },
            documents: function($stateParams, ViewService) {
                return ViewService.getSiteDocuments($stateParams.site, null, $stateParams.ws, null);
            },
            ws: function($stateParams) {
                return $stateParams.ws;
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="DocWeb" mms-ws="{{ws}}" mms-site="{{site}}"></mms-nav>',
                controller: function($scope, $stateParams, ws, site) {
                    $scope.ws = ws;
                    $scope.site = site.name;
                }
            },
            'pane-center': {
                templateUrl: 'partials/docweb/pane-center.html',
                controller: 'DocWebCtrl'
            },
            'pane-left': {
                templateUrl: 'partials/shared/pane-left.html',
                controller: 'DocWebTreeCtrl'
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
    /*.state('portal.site', {
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
    })*/;
});

/*'use strict';

            views: {
                'config': {
                    templateUrl: 'partials/docweb/config.html',
                    controller: 'ConfigsCtrl'
                },
                'view@': {
                    templateUrl: 'partials/docweb/latest.html',
                    controller: function($scope, site, products, ws, ViewService, growl) {
                        $scope.products = products;
                        $scope.site = site.name;
                        $scope.ws = ws;
                        $scope.create = function() {
                            ViewService.createDocument($scope.newDocName, $scope.site, $scope.ws)
                            .then(function(data) {
                                growl.success("Create Document Successful");
                            }, function(reason) {
                                growl.error("Create Document Error: " + reason.message);
                            });
                        };
                    }
                }
            }
        })
        .state('docweb.new', {
            url: '/new',
            resolve: {
            },
            views: {
                'view@': {
                    templateUrl: 'partials/docweb/new.html',
                    controller: 'NewCtrl'
                }
            }
        })
        .state('docweb.config', {
            url: '/config/:configId',
            resolve: {
                config: function($stateParams, site, ConfigService, ws) {
                    return ConfigService.getConfig($stateParams.configId, site.name, ws);
                },
                configSnapshots: function($stateParams, site, ConfigService, ws) {
                    return ConfigService.getConfigSnapshots($stateParams.configId, site.name, ws);
                }
            },
            views: {
                'view@': {
                    templateUrl: 'partials/docweb/config-view.html',
                    controller: 'ConfigCtrl'
                }
            }
        });
    });
*/