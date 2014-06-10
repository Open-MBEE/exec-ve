'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
        .state('docweb', {
            url: '/sites/:site',
            resolve: {
                site: function($stateParams, SiteService) {
                    return SiteService.getSite($stateParams.site);
                },
                configs: function($stateParams, ConfigService) {
                    return ConfigService.getConfigs('master', $stateParams.site);
                }
            },
            views: {
                'menu': {
                    template: '<mms-nav site="{{site}}" title="{{title}}" type="docweb"></mms-nav>',
                    controller: function($scope, $stateParams, site) {
                        $scope.site = site.title;
                        $scope.title = "DocWeb";
                    }
                },
                'config': {
                    templateUrl: 'partials/docweb/config.html',
                    controller: 'ConfigsCtrl'
                }
            }
        })
        .state('docweb.latest', {
            url: '/latest',
            resolve: {
                products: function(site, ViewService) {
                    return ViewService.getDocuments('master', site.name, null, null);
                }
            },
            views: {
                'view@': {
                    templateUrl: 'partials/docweb/latest.html',
                    controller: function($scope, site, products) {
                        $scope.products = products;
                        $scope.site = site.title;
                    }
                }
            }
        })
        .state('docweb.new', {
            url: '/new',
            resolve: {
                products: function(site, ViewService) {
                    return ViewService.getDocuments('master', site.name, null, null);
                }
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
                config: function($stateParams, site, ConfigService) {
                    return ConfigService.getConfig('master', site.name, $stateParams.configId);
                }
                /*snapshots: function($stateParams, ConfigService) {
                    return ConfigService.getSnapshotsForConfig('master', $stateParams.site, $stateParams.configId);
                }*/
            },
            views: {
                'view@': {
                    templateUrl: 'partials/docweb/config-view.html',
                    controller: 'ConfigCtrl'
                }
            }
        });
    });
