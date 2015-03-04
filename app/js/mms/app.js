'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl', 'timelyModule'])
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
    .state('workspaces', {
        url: '/workspaces',
        resolve: {
            workspaces: function(WorkspaceService) {
                return WorkspaceService.getWorkspaces();
            },
            workspace: function () {
                return 'master';
            },
            workspaceObj: function (WorkspaceService, workspace) {
                // TODO; replace workspace with workspaceObj, but first all controllers
                // need to be adapted to handle workspace as an object and not a string
                return WorkspaceService.getWorkspace(workspace);
            },  
            tags: function(ConfigService, workspace) {
                return ConfigService.getConfigs(workspace, false);
            },
            tag: function ($stateParams, ConfigService, workspace) {
                return { name: 'latest', timestamp: 'latest' };
            },  
            sites: function(SiteService) {                 
               return SiteService.getSites();
            },
            site: function(SiteService) {
                return SiteService.getSite('no_site');
            },
            document : function(ElementService, workspace, time, growl) {
            
                // This is a short-term work-around -- all this should be done the back-end MMS in the future
                var wsCoverDocId = 'master_cover';

                return ElementService.getElement(wsCoverDocId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if (reason.status !== 404 || time !== 'latest') return null;

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

                    return ElementService.createElement(doc, workspace, null)
                    .then(function(data) {
                        // growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                });
            },
            views: function() {
                return null;
            },
            view: function() {
                return null;
            },
            viewElements: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },   
            time: function(tag) {
                return tag.timestamp;
            },
            configSnapshots: function(ConfigService, workspace, tag) {
                return [];
            },
            snapshots: function() {
                return [];        
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="tag"></mms-nav>',
                controller: function ($scope, workspace, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                }
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
    .state('workspace', {
        parent: 'workspaces',
        url: '/:workspace?tag',
        resolve: {
            workspace: function ($stateParams) {
                return $stateParams.workspace;
            },
            workspaceObj: function (WorkspaceService, workspace) {
                return WorkspaceService.getWorkspace(workspace);
            },
            sites: function(SiteService, time) {                 
                if (time === 'latest')
                    return SiteService.getSites();
                return SiteService.getSites(time);
            },
            site: function(SiteService) {
                return SiteService.getSite('no_site');
            },
            document : function(ElementService, workspace, time, growl, workspaceObj) {
            
                // This is a short-term work-around -- all this should be done the back-end MMS in the future
                var wsCoverDocId = 'master_cover';

                return ElementService.getElement(wsCoverDocId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if (reason.status !== 404 || time !== 'latest') return null;

                    var doc = {
                        specialization: {type: "View"},
                        name: 'Workspace ' + workspaceObj.name + ' Cover Page',
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

                    return ElementService.createElement(doc, workspace, null)
                    .then(function(data) {
                        // growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                });
            },
            views: function(ViewService, workspace, document, time) {
                return [];
                /*if (document === null) 
                    return [];
                return ViewService.getDocumentViews(document.sysmlid, false, workspace, time, true);*/
            },
            viewElements: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return [];
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },    
            view: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlid, false, workspace, time);
            },
            tags: function(ConfigService, workspace) {
                return ConfigService.getConfigs(workspace, false);
            },
            tag: function ($stateParams, ConfigService, workspace) {
                if ($stateParams.tag === undefined || $stateParams.tag === 'latest')
                    return { name: 'latest', timestamp: 'latest' };
                return ConfigService.getConfig($stateParams.tag, workspace, false);
            },        
            configSnapshots: function(ConfigService, workspace, tag) {
                if (tag.timestamp === 'latest')
                    return [];
                return ConfigService.getConfigSnapshots(tag.id, workspace, false);
            },
            time: function(tag) {
                return tag.timestamp;
            }
        },
        views: {
            'menu@': {
                template: '<mms-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="tag"></mms-nav>',
                controller: function ($scope, workspace, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                }
            },
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            },
            'pane-right@': {
                templateUrl: 'partials/mms/pane-right.html',
                controller: 'ToolCtrl'
            },
            'toolbar-right@': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }    
        }
    })
    .state('workspace.sites', {
        url: '/sites',
        resolve: {
            document : function($stateParams, ElementService, workspace, site, time, growl) {
                var siteCoverDocId;
                if ($stateParams.site === 'no_site')
                    siteCoverDocId = 'master_cover';
                else
                    siteCoverDocId = site.sysmlid + '_cover';

                return ElementService.getElement(siteCoverDocId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if (reason.status !== 404 || time !== 'latest') return null;
                    
                    // if it is a tag look-up, then don't create element
                    if (time !== 'latest') 
                        return null;

                    var doc = {
                        specialization: {type: "View"},
                        name: site.name + ' Cover Page',
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

                    return ElementService.createElement(doc, workspace, site.sysmlid)
                    .then(function(data) {
                        growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                });
            },
            views: function(ViewService, workspace, document, time) {
                return [];
                /*if (document === null) 
                    return null;
                return ViewService.getDocumentViews(document.sysmlid, false, workspace, time, true);*/
            },
            viewElements: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },    
            view: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlid, false, workspace, time);
            }
        },
        parent: 'workspace',
        views: {
            'menu@': {
                template: '<mms-nav mms-title="Portal" mms-ws="{{workspace}}" mms-site="site" mms-config="tag"></mms-nav>',
                controller: function ($scope, workspace, site, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                }
            },
            'pane-left@': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl'
            },
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            }, 
            'toolbar-right@': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }
        }  
    })
    .state('workspace.site', {
        url: '/:site',
        parent: 'workspace.sites',
        resolve: {
            site: function($stateParams, SiteService) {
                return SiteService.getSite($stateParams.site);
            },
            document : function($stateParams, ElementService, workspace, site, time, growl) {
                var siteCoverDocId;
                if ($stateParams.site === 'no_site')
                    siteCoverDocId = 'master_cover';
                else
                    siteCoverDocId = site.sysmlid + '_cover';

                return ElementService.getElement(siteCoverDocId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if (reason.status !== 404 || time !== 'latest') return null;
                    
                    // if it is a tag look-up, then don't create element
                    if (time !== 'latest') 
                        return null;

                    var doc = {
                        specialization: {type: "View"},
                        name: site.sysmlid + ' Cover Page',
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

                    return ElementService.createElement(doc, workspace, site.sysmlid)
                    .then(function(data) {
                        growl.success('Created Document Successful');
                        return data;
                    }, function(reason) {
                        return null;

                    });

                });
            },
            views: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return null;
                return ViewService.getDocumentViews(document.sysmlid, false, workspace, time, true);
            },
            viewElements: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },    
            view: function(ViewService, workspace, document, time) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlid, false, workspace, time);
            }
        },
        views: {
            'menu@': {
                template: '<mms-nav mms-title="Portal" mms-ws="{{workspace}}" mms-site="site" mms-config="tag"></mms-nav>',
                controller: function ($scope, workspace, site, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                }
            },
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            }, 
            'toolbar-right@': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }                    
        }
    })
    .state('workspace.site.documentpreview', {
        url: '/document/:previewDocument',
        resolve: {
            documentPreview: function($stateParams, ElementService, workspace, time) {
                return ElementService.getElement($stateParams.previewDocument, false, workspace, time);
            },
            snapshot: function(configSnapshots, documentPreview) {
                var docid = documentPreview.sysmlid;
                var found = null;
                configSnapshots.forEach(function(snapshot) {
                    if (docid === snapshot.sysmlid)
                        found = snapshot;
                });
                return found; 
            }
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center-doc.html',
                controller: 'DocPreviewCtrl'
            }
        }
    })
    .state('workspace.site.document', {
        url: '/documents/:document?time',
        resolve: {
            document: function($stateParams, ElementService, time) {
                return ElementService.getElement($stateParams.document, false, $stateParams.workspace, time);
            },
            views: function($stateParams, ViewService, document, time) {
                if (document.specialization.type !== 'Product')
                    return [];
                return ViewService.getDocumentViews($stateParams.document, false, $stateParams.workspace, time, true);
            },
            viewElements: function($stateParams, ViewService, time) {
                return ViewService.getViewElements($stateParams.document, false, $stateParams.workspace, time);
            },
            view: function($stateParams, ViewService, viewElements, time) {
                return ViewService.getView($stateParams.document, false, $stateParams.workspace, time);
            },
            snapshots: function(ConfigService, workspace, site, document) {
                if (document.specialization.type !== 'Product')
                    return [];
                return ConfigService.getProductSnapshots(document.sysmlid, site.sysmlid, workspace);
            },
            time: function($stateParams, tag) {
                if ($stateParams.time === undefined)
                    return tag.timestamp;
                return $stateParams.time;
            }        
        },
        views: {
            'menu@': {
                template: '<mms-nav mms-title="View Editor" mms-ws="{{workspace}}" mms-site="site" mms-doc="document" mms-config="tag" mms-snapshot-tag="{{snapshotTag}}""></mms-nav>',
                controller: function ($scope, $filter, workspace, site, document, tag, snapshots, time) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                    $scope.document = document;

                    var tagStr = '';
                    if (time !== 'latest') {
                        snapshots.forEach(function(snapshot) {
                            if (time === snapshot.created && snapshot.configurations && snapshot.configurations.length > 0)
                                snapshot.configurations.forEach(function(config) {
                                    tagStr += '(' + config.name + ') ';
                                    $scope.tag = config;
                                });
                        });
                        tagStr += '(' + $filter('date')(time, 'M/d/yy h:mm a') + ')';

                        $scope.snapshotTag = ' ' + tagStr;
                    }                                        
                }
            },
            'pane-left@': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl'
            },          
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            },
            'pane-right@': {
                templateUrl: 'partials/mms/pane-right.html',
                controller: 'ToolCtrl'
            },
            'toolbar-right@': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }
         }
    })
    .state('workspace.site.document.order', {
        url: '/order',
        views: {      
            'pane-center@': {
                templateUrl: 'partials/mms/reorder-views.html',
                controller: 'ReorderCtrl'
            }
        }
    })
    .state('workspace.site.document.full', {
        url: '/full',
        views: {      
            'pane-center@': {
                templateUrl: 'partials/mms/full-doc.html',
                controller: 'FullDocCtrl'
            }
        }
    })
    .state('workspace.site.document.view', {
        url: '/views/:view',
        resolve: {
            viewElements: function($stateParams, ViewService, time) {
                if (time === 'latest')
                    return ViewService.getViewElements($stateParams.view, false, $stateParams.workspace, time);
                return [];
            },
            view: function($stateParams, ViewService, viewElements, time) {
                return ViewService.getView($stateParams.view, false, $stateParams.workspace, time);
            }
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            }
        }
    })
    .state('workspace.diff', {
        url: '/diff/:source/:sourceTime/:target/:targetTime',
        resolve: {
            diff: function($stateParams, WorkspaceService) {
                return WorkspaceService.diff($stateParams.target, $stateParams.source, $stateParams.targetTime, $stateParams.sourceTime);
            }
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/diff-pane-center.html'
            },
            'pane-left@': {
                templateUrl: 'partials/mms/diff-pane-left.html',
                controller: 'WorkspaceDiffChangeController'
            },
            'pane-right@': {
                templateUrl: 'partials/mms/diff-pane-right.html',
                controller: 'WorkspaceDiffTreeController'
            },
            'toolbar-right@': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }
        }
    })
    .state('workspace.diff.view', {
        url: '/element/:elementId',
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/diff-view-pane-center.html',
                controller: 'WorkspaceDiffElementViewController'
            }
        }
    });
});