'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    // TODO: Add default state to resolve to workspace : master
    $stateProvider
    .state('workspace', {
        url: '/workspaces/:workspace',
        resolve: {
            workspaces: function(WorkspaceService) {
                return WorkspaceService.getWorkspaces();
            },
            sites: function(SiteService) { return null; },
            document: function() { return null; },
            views: function() { return null; }
        },
        views: {
            'menu': {
                // TODO: mms-title generic
                // TODO: mms-config generic 
                // TODO: mms-nav links need to redirect to point to states instead of html url pages
                template: '<mms-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="latest"></mms-nav>',
                controller: function ($scope, $stateParams) {
                    $scope.workspace = $stateParams.workspace;
                }
                // TODO: mms-nav for portal
                // TODO: mms-nav for view editor
            },
            'pane-left': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl'
            },
            'toolbar-right': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }            
        }
    })
    .state('workspace.site', {
        url: '/sites/:site',
        resolve: {
            sites: function(SiteService) {
                return SiteService.getSites();
                
                // TODO: Sites based on config
                /* if (config === 'latest')
                    return SiteService.getSites();
                return SiteService.getSites(config.timestamp); */
            }
        },
        views: {
            'pane-left@': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl'
            }
        }
    })
    .state('workspace.site.document', {
        url: '/documents/:document',
        resolve: {
            document: function($stateParams, ElementService) {
                // TODO fix for configs
                var time = 'latest';
                return ElementService.getElement($stateParams.document, false, $stateParams.workspace, time);
            },
            views: function($stateParams, ViewService, document) {
                var time = 'latest';
                if (document.specialization.type !== 'Product')
                    return [];
                return ViewService.getDocumentViews($stateParams.document, false, $stateParams.workspace, time, true);
            },
        },
        views: {
            'pane-left@': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl'
            }
        }
    });
});