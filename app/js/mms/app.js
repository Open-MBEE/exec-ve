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
            sites: function(SiteService) { 
                
                // TODO: Sites based on config
                /* if (config === 'latest')
                    return SiteService.getSites();
                return SiteService.getSites(config.timestamp); */
                return SiteService.getSites(); 
            },
            site: function($stateParams, SiteService) {
                return SiteService.getSite('no_site');
            },
            document : function($stateParams, ElementService, growl) {
            
                // This is a short-term work-around -- all this should be done the back-end MMS in the future
                var wsCoverDocId = 'master_cover';

                return ElementService.getElement(wsCoverDocId, false, $stateParams.workspace, 'latest')
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if (reason.status !== 404) return null;

                    var doc = {
                        specialization: {type: "View"},
                        name: 'Workspace Cover Page',
                        documentation: ''
                    };
                    doc.sysmlid = wsCoverDocId;
                    doc.specialization.contains = [
                        {
                            'type': 'Paragraph',
                            'sourceType': 'reference',
                            'source': wsCoverDocId,
                            'sourceProperty': 'documentation'
                        }
                    ];
                    doc.specialization.allowedElements = [wsCoverDocId];
                    doc.specialization.displayedElements = [wsCoverDocId];
                    doc.specialization.childrenViews = [];

                    return ElementService.createElement(doc, $stateParams.workspace, null)
                    .then(function(data) {
                        // growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                }).finally(function(){
                    return null;
                });
            },
            views: function($stateParams, ViewService, document, time) {
                return ViewService.getDocumentViews(document.sysmlid, false, $stateParams.workspace, time, true);
            },
            viewElements: function($stateParams, ViewService, document, time) {
                return ViewService.getViewElements(document.sysmlid, false, $stateParams.workspace, time);
            },    
            view: function($stateParams, ViewService, document, viewElements, time) {
                return ViewService.getView(document.sysmlid, false, $stateParams.workspace, time);
            },        
            time: function($stateParams) {
                // TODO: grab from stateParams if exists
                return 'latest';
            }
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
            'pane-center': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            },
            'pane-right': {
                templateUrl: 'partials/mms/pane-right.html',
                controller: 'ToolCtrl'
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
            site: function($stateParams, SiteService) {
                return SiteService.getSite($stateParams.site);
            },
            document : function($stateParams, ElementService, time, growl) {
            
                var siteCoverDocId = $stateParams.site + '_cover';

                return ElementService.getElement(siteCoverDocId, false, $stateParams.workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if (reason.status !== 404) return null;
                    
                    // if it is a tag look-up, then don't create element
                    if (time !== 'latest') 
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

                    return ElementService.createElement(doc, $stateParams.workspace, $stateParams.site)
                    .then(function(data) {
                        growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                }).finally(function(){
                    return null;
                });
            },
            views: function($stateParams, ViewService, document, time) {
                return ViewService.getDocumentViews(document.sysmlid, false, $stateParams.workspace, time, true);
            },
            viewElements: function($stateParams, ViewService, document, time) {
                return ViewService.getViewElements(document.sysmlid, false, $stateParams.workspace, time);
            },    
            view: function($stateParams, ViewService, document, viewElements, time) {
                return ViewService.getView(document.sysmlid, false, $stateParams.workspace, time);
            }            
        },
        views: {
            'pane-left@': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl'
            },
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            }        
        }
    })
    .state('workspace.site.document', {
        url: '/documents/:document',
        resolve: {
            document: function($stateParams, ElementService, time) {
                return ElementService.getElement($stateParams.document, false, $stateParams.workspace, time);
            },
            views: function($stateParams, ViewService, document, time) {
                if (document.specialization.type !== 'Product')
                    return [];
                return ViewService.getDocumentViews($stateParams.document, false, $stateParams.workspace, time, true);
            }
        },
        views: {
            'pane-left@': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl'
            }
        }
    })
    .state('workspace.site.document.view', {
        url: '/view/:view',
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            },
            'pane-right@': {
                templateUrl: 'partials/mms/pane-right.html',
                controller: 'ToolCtrl'
            }
        },
        resolve: {
            viewElements: function($stateParams, ViewService, time) {
                return ViewService.getViewElements($stateParams.view, false, $stateParams.workspace, time);
            },
            view: function($stateParams, ViewService, viewElements, time) {
                return ViewService.getView($stateParams.view, false, $stateParams.workspace, time);
            }
        }
    });
});