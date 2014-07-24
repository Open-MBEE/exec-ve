'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'angular-growl'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
        .state('docweb', {
            url: '/sites/:site',
            resolve: {
                site: function($stateParams, SiteService) {
                    return SiteService.getSite($stateParams.site);
                },
                configs: function($stateParams, ConfigService) {
                    return ConfigService.getSiteConfigs($stateParams.site, 'master');
                },
                products: function($stateParams, ViewService) {
                    return ViewService.getSiteDocuments($stateParams.site, null, 'master', null);
                }            
            },
            views: {
                'menu': {
                    template: '<mms-nav mms-site="{{site}}" mms-title="{{title}}" mms-type="DocWeb" mms-goto="true" mms-other-sites="true"></mms-nav>',
                    controller: function($scope, $stateParams, site) {
                        $scope.site = site.name;
                        $scope.title = "Configurations";
                    }
                },
                'config': {
                    templateUrl: 'partials/docweb/config.html',
                    controller: 'ConfigsCtrl'
                },
                'view@': {
                    templateUrl: 'partials/docweb/latest.html',
                    controller: function($scope, site, products) {
                        $scope.products = products;
                        $scope.site = site.name;
                    }
                }
            }
        })
        /* .state('docweb.latest', {
            url: '/latest',
            resolve: {
            },
            views: {
                'view@': {
                    templateUrl: 'partials/docweb/latest.html',
                    controller: function($scope, site, products) {
                        $scope.products = products;
                        $scope.site = site.name;
                    }
                }
            }
        }) */
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
                config: function($stateParams, site, ConfigService) {
                    return ConfigService.getConfig($stateParams.configId, site.name, 'master');
                },
                configSnapshots: function($stateParams, site, ConfigService) {
                    return ConfigService.getConfigSnapshots($stateParams.configId, site.name, 'master');
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
