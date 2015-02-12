'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('portal', {
        url: '/workspaces/:ws/tags/:config',
        resolve: {
            ws: function($stateParams) {
                return $stateParams.ws;
            },
            config: function($stateParams, ConfigService) {
                if ($stateParams.config === 'latest')
                    return 'latest';
                return ConfigService.getConfig($stateParams.config, $stateParams.ws, false);
            },
            sites: function($stateParams, SiteService, config) {
                if (config === 'latest')
                    return SiteService.getSites();
                return SiteService.getSites(config.timestamp);
            },
            configurations: function($stateParams, ConfigService) {
                return ConfigService.getConfigs($stateParams.ws, false);
            },
            configSnapshots: function($stateParams, ConfigService) {
                if ($stateParams.config === 'latest')
                    return [];
                return ConfigService.getConfigSnapshots($stateParams.config, $stateParams.ws, false);
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="Portal" mms-ws="{{ws}}" mms-config="{{config}}"></mms-nav>',
                controller: function($scope, $stateParams, ws, config) {
                    $scope.ws = ws;
                    if (config !== 'latest')
                        $scope.config = config.id;
                    else
                        $scope.config = 'latest';
                }
            },
            'pane-center': {
                templateUrl: 'partials/portal/pane-center.html'
            },
            'pane-left': {
                templateUrl: 'partials/shared/pane-left.html',
                controller: 'NavTreeCtrl'
            },
            'pane-right': {
                templateUrl: 'partials/portal/pane-right.html',
                controller: 'ToolCtrl'
            },
            'toolbar-right': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }            
        }
    })
    .state('portal.site', {
        url: '/sites/:site',
        resolve: {
            documents: function($stateParams, ViewService) {
                return ViewService.getSiteDocuments($stateParams.site, false, $stateParams.ws);
            },
            site : function($stateParams) {
                return $stateParams.site;
            },
            siteCoverDoc : function($stateParams, ElementService, config, growl) {
            
                var siteCoverDocId = $stateParams.site + '_cover';

                return ElementService.getElement(siteCoverDocId, false, $stateParams.ws, config.timestamp)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    // TODO if (reason.status === 404) return null;
                    
                    // if it is a tag look-up, then don't create element
                    if ($stateParams.config !== 'latest') 
                        return null;

                    var doc = {
                        specialization: {type: "View"},
                        name: $stateParams.site + ' Cover Page',
                        documentation: ''
                    };
                    doc.sysmlid = siteCoverDocId;
                    doc.specialization.contains = [
                        {
                            'type': 'Paragraph',
                            'sourceType': 'reference',
                            'source': siteCoverDocId,
                            'sourceProperty': 'documentation'
                        }
                    ];
                    doc.specialization.allowedElements = [siteCoverDocId];
                    doc.specialization.displayedElements = [siteCoverDocId];
                    doc.specialization.childrenViews = [];

                    return ElementService.createElement(doc, $stateParams.ws, $stateParams.site)
                    .then(function(data) {
                        growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                }).finally(function(){
                    return null;
                });

            }
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/portal/pane-center.html',
                controller: 'SiteCtrl'
            }
        }
    })
    .state('portal.site.view', {
        url: '/docs/:docid',
        resolve: {
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/portal/pane-center-doc.html',
                controller: 'DocCtrl'
            }
        }
    });
});


