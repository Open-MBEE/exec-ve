'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl', 'timelyModule'])
.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.rule(function ($injector, $location) {
        // determine if the url is older 2.0 format (will not have a workspace)
        if ($location.url().indexOf('/workspaces') === -1)
        {
            var locationPath = 'workspaces/master' + $location.url();

            // determine if this came from docweb.html or ve.html, is there a product?
            if (locationPath.indexOf('/products/') !== -1) {

                // replace products with documents
                locationPath = locationPath.replace('/products/', '/documents/');
                locationPath = locationPath.replace('/view/', '/views/');

                // if there is a view, there should be a time in the url prior
                var pathArr = locationPath.split('/');

                // get the time param and remove it from the array
                var time = pathArr[6]; 
                pathArr.splice(6,1);

                locationPath = pathArr.join('/');

                // add time as query param if it is not latest
                if (time && time !== 'latest') {
                    locationPath = locationPath + "?time=" + time;
                }
            }
            $location.url(locationPath);
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
            },
            snapshot: function() {
                return null;
            },
            siteDocsFilter: function() {
                return null;
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="tag"></mms-nav>',
                controller: function ($scope, $rootScope, workspace, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $rootScope.mms_title = 'Model Manager';
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
                        return data;
                    }, function(reason) {
                        return null;
                    });

                });
            },
            views: function(ViewService, workspace, document, time) {
                return [];
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
                controller: function ($scope, $rootScope, workspace, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $rootScope.mms_title = 'Model Manager';
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
        },
        parent: 'workspace',
        views: {
            'menu@': {
                template: '<mms-nav mms-title="Portal" mms-ws="{{workspace}}" mms-site="site" mms-config="tag"></mms-nav>',
                controller: function ($scope, $rootScope, workspace, site, tag, workspaceObj) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                    $rootScope.mms_title = 'Portal: '+workspaceObj.name;
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
                        return data;
                    }, function(reason) {
                        return null;
                    });
                });
            },
            siteDocsFilter: function($stateParams, ElementService, workspace, site, time, growl) {
                //create dummy element that contains document ids that should be filtered out (not shown for site)
                var siteDocsViewId;
                if ($stateParams.site === 'no_site')
                    return null;
                else
                    siteDocsViewId = site.sysmlid + '_filtered_docs';

                return ElementService.getElement(siteDocsViewId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {
                    if (reason.status !== 404 || time !== 'latest') return null;
                    var siteDocs = {
                        specialization: {type: "Element"},
                        name: site.name + ' Filtered Docs',
                        documentation: '{}'
                    };
                    siteDocs.sysmlid = siteDocsViewId;
                    return ElementService.createElement(siteDocs, workspace, site.sysmlid)
                    .then(function(data) {
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
                controller: function ($scope, $rootScope, workspace, site, tag, workspaceObj) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                    $rootScope.mms_title = 'Portal: '+workspaceObj.name;
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
        url: '/document/:document',
        resolve: {
            document: function($stateParams, ElementService, workspace, time) {
                return ElementService.getElement($stateParams.document, false, workspace, time);
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
            },
            snapshot: function(configSnapshots, document) {
                var docid = document.sysmlid;
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
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
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
            snapshot: function(configSnapshots, document) {
                var docid = document.sysmlid;
                var found = null;
                configSnapshots.forEach(function(snapshot) {
                    if (docid === snapshot.sysmlid)
                        found = snapshot;
                });
                return found; 
            },
            tag: function ($stateParams, ConfigService, workspace, snapshots) {
                if ($stateParams.tag === undefined)
                {
                    if ($stateParams.time !== undefined && $stateParams.time !== 'latest') {
                        
                        var snapshotFound = false;
                        var snapshotPromise;
                        // if time is defined, then do a reverse look-up from the
                        // product snapshots to determine if there is a match tag
                        snapshots.forEach(function(snapshot) {
                            if (snapshot.created === $stateParams.time) {
                                // product snapshot found based on time, 
                                // next see if there is a configuration for the snapshot
                                if (snapshot.configurations && snapshot.configurations.length > 0) {
                                    // there may be 0 or more, if there is more than 1, 
                                    // base the configuration tag on the first one
                                    snapshotFound = true;

                                    snapshotPromise = ConfigService.getConfig(snapshot.configurations[0].id, workspace, false);
                                }
                            }
                        });
                        if (snapshotFound)
                            return snapshotPromise;
                        else 
                            return { name: 'latest', timestamp: 'latest' };
                    } else {
                        return { name: 'latest', timestamp: 'latest' };
                    }
                } else if ($stateParams.tag === 'latest') {
                    return { name: 'latest', timestamp: 'latest' };
                } else {
                    return ConfigService.getConfig($stateParams.tag, workspace, false);
                }
            },        
            configSnapshots: function(ConfigService, workspace, tag) {
                if (tag.timestamp === 'latest')
                    return [];
                return ConfigService.getConfigSnapshots(tag.id, workspace, false);
            },
            time: function($stateParams, ConfigService, workspace) {
                if ($stateParams.tag !== undefined) {
                    return ConfigService.getConfig($stateParams.tag, workspace, false).then(function(tag) {
                        return tag.timestamp;
                    }); 
                }
                else if ($stateParams.time !== undefined)
                    return $stateParams.time;
                else
                    return "latest";
            },
            siteDocsFilter: function($stateParams, ElementService, workspace, site, time, growl) {
                //need to redefine here since time is redefined
                var siteDocsViewId;
                if ($stateParams.site === 'no_site')
                    return null;
                else
                    siteDocsViewId = site.sysmlid + '_filtered_docs';

                return ElementService.getElement(siteDocsViewId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {
                    return null;
                });
            },
        },
        views: {
            'menu@': {
                template: '<mms-nav mms-title="View Editor" mms-ws="{{workspace}}" mms-site="site" mms-doc="document" mms-config="tag" mms-snapshot-tag="{{snapshotTag}}" mms-show-tag="{{showTag}}"></mms-nav>',
                controller: function ($scope, $filter, $rootScope, workspace, site, document, tag, snapshots, time, siteDocsFilter) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                    $scope.document = document;

                    $scope.showTag = true;
                    $rootScope.mms_title = 'View Editor: '+document.name;
                    var filtered = {};
                    if (siteDocsFilter)
                        filtered = JSON.parse(siteDocsFilter.documentation);

                    var tagStr = '';
                    if (time !== 'latest') {
                        snapshots.forEach(function(snapshot) {
                            if (filtered[document.sysmlid])
                                return;
                            if (time === snapshot.created && snapshot.configurations && snapshot.configurations.length > 0)
                                snapshot.configurations.forEach(function(config) {
                                    tagStr += '( <i class="fa fa-tag"></i> ' + config.name + ' ) ';
                                    $scope.tag = config;
                                });
                        });
                        tagStr += '( <i class="fa fa-camera"></i> ' + $filter('date')(time, 'M/d/yy h:mm a') + ' )';
                        if (filtered[document.sysmlid])
                            $scope.showTag = false;
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
                template: '<mms-toolbar buttons="buttons" mms-tb-api="tbApi"></mms-toolbar>',
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