'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl', 'cfp.hotkeys'])
.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.rule(function ($injector, $location) {
        // determine if the url is older 2.0 format (will not have a workspace)
        if ($location.url().indexOf('/workspaces') === -1)
        {
            var locationPath = 'workspaces/master' + $location.url();

            var queryParams = '';
            var pathArr = locationPath.split('/');

            // determine if this came from docweb.html or ve.html, is there a product?
            if (locationPath.indexOf('/products/') !== -1) {

                // replace products with documents
                locationPath = locationPath.replace('/products/', '/documents/');
                locationPath = locationPath.replace('/view/', '/views/');
                locationPath = locationPath.replace('/all', '/full');

                // if there is a view, there should be a time in the url prior
                pathArr = locationPath.split('/');

                // get the time param and remove it from the array
                var time = pathArr[6]; 
                pathArr.splice(6,1);

                // add time as query param if it is not latest
                if (time && time !== 'latest') {
                    queryParams += 'time=' + time;
                }

            }

            // if there is a config, remove it and add it as a tag query param
            var idxOfTag = pathArr.indexOf('config');    
            if (idxOfTag !== -1) {
                var tag = pathArr[idxOfTag+1];
                queryParams += 'tag=' + tag;
                pathArr.splice(idxOfTag, 2);
                var idxOfSite = pathArr.indexOf('sites'); //redirect old config page to tag landing page
                if (idxOfSite !== -1)
                    pathArr.splice(idxOfSite, 2);
            }

            locationPath = pathArr.join('/');


            if (queryParams !== '') {
                locationPath += '?' + queryParams;
            }

            $location.url(locationPath);
        }

    });

    $stateProvider
    .state('workspaces', {
        url: '/workspaces',
        resolve: {
            dummyLogin: function($http, URLService) {
                return $http.get(URLService.getCheckLoginURL());
            },
            workspaces: function(WorkspaceService, dummyLogin) {
                return WorkspaceService.getWorkspaces();
            },
            workspace: function (dummyLogin) {
                return 'master';
            },
            workspaceObj: function (WorkspaceService, workspace, dummyLogin) {
                // TODO; replace workspace with workspaceObj, but first all controllers
                // need to be adapted to handle workspace as an object and not a string
                return WorkspaceService.getWorkspace(workspace);
            },  
            tags: function(ConfigService, workspace, dummyLogin) {
                return ConfigService.getConfigs(workspace, false);
            },
            tag: function ($stateParams, ConfigService, workspace, dummyLogin) {
                return { name: 'latest', timestamp: 'latest' };
            },  
            sites: function(SiteService, dummyLogin) {                 
               return SiteService.getSites();
            },
            site: function(SiteService, dummyLogin) {
                return SiteService.getSite('no_site');
            },
            document : function(ElementService, workspace, time, growl, dummyLogin) {
                return null;
            },
            views: function(dummyLogin) {
                return null;
            },
            view: function(dummyLogin) {
                return null;
            },
            viewElements: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },   
            time: function(tag, dummyLogin) {
                return tag.timestamp;
            },
            configSnapshots: function(ConfigService, workspace, tag, dummyLogin) {
                return [];
            },
            snapshots: function(dummyLogin) {
                return [];        
            },
            snapshot: function(dummyLogin) {
                return null;
            },
            docFilter: function(dummyLogin) {
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
            workspaceObj: function (WorkspaceService, workspace, dummyLogin) {
                return WorkspaceService.getWorkspace(workspace);
            },
            sites: function(SiteService, time, dummyLogin) {                 
                if (time === 'latest')
                    return SiteService.getSites();
                return SiteService.getSites(time);
            },
            site: function(SiteService, dummyLogin) {
                return SiteService.getSite('no_site');
            },
            document : function(ViewService, ElementService, workspace, time, growl, workspaceObj, dummyLogin) {
            
                // This is a short-term work-around -- all this should be done the back-end MMS in the future
                var wsCoverDocId = 'master_cover';

                return ElementService.getElement(wsCoverDocId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if ((reason.status !== 404 && reason.status !== 410) || time !== 'latest') return null;

                    var viewName = 'Workspace ' + workspaceObj.name + ' Cover Page';

                    return ViewService.createView(undefined, viewName, undefined, workspace, wsCoverDocId)
                    .then(function(data) {
                        return data;
                    }, function(reason) {
                        return null;
                    });
                });
            },
            docFilter: function(ElementService, workspace, time, document, dummyLogin) {
                return ElementService.getElement("master_filter", false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {
                    if (reason.status !== 404 || time !== 'latest') return null;
                    var siteDocs = {
                        specialization: {type: "Element"},
                        name: 'Filtered Docs',
                        documentation: '{}'
                    };
                    siteDocs.sysmlid = "master_filter";
                    return ElementService.createElement(siteDocs, workspace, null)
                    .then(function(data) {
                        return data;
                    }, function(reason) {
                        return null;
                    });
                });
            },
            views: function(ViewService, workspace, document, time, dummyLogin) {
                return [];
            },
            viewElements: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return [];
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },    
            view: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlid, false, workspace, time);
            },
            tags: function(ConfigService, workspace, dummyLogin) {
                return ConfigService.getConfigs(workspace, false);
            },
            tag: function ($stateParams, ConfigService, workspace, dummyLogin) {
                if ($stateParams.tag === undefined || $stateParams.tag === 'latest')
                    return { name: 'latest', timestamp: 'latest' };
                return ConfigService.getConfig($stateParams.tag, workspace, false);
            },        
            configSnapshots: function(ConfigService, workspace, tag, dummyLogin) {
                if (tag.timestamp === 'latest')
                    return [];
                return ConfigService.getConfigSnapshots(tag.id, workspace, false);
            },
            time: function(tag, dummyLogin) {
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
            site: function($stateParams, SiteService, dummyLogin) {
                return SiteService.getSite($stateParams.site);
            },
            document : function($stateParams, ViewService, ElementService, workspace, site, time, growl, dummyLogin) {
                var siteCoverDocId;
                if ($stateParams.site === 'no_site')
                    return null;
                    //siteCoverDocId = 'master_cover';
                else
                    siteCoverDocId = site.sysmlid + '_cover';

                return ElementService.getElement(siteCoverDocId, false, workspace, time)
                .then(function(data) {
                    return data;
                }, function(reason) {

                    // if it is an error, other than a 404 (element not found) then stop and return
                    if ((reason.status !== 404 && reason.status !== 410) || time !== 'latest') return null;
                    
                    // if it is a tag look-up, then don't create element
                    if (time !== 'latest') 
                        return null;

                    var viewName = site.name + ' Cover Page';
                    var viewDoc = '<mms-site-docs data-mms-site="' + site.sysmlid + '">[cf:site docs]</mms-site-docs>';

                    return ViewService.createView(undefined, viewName, undefined, workspace, siteCoverDocId, viewDoc, site.sysmlid)
                    .then(function(data) {
                        return data;
                    }, function(reason) {
                        return null;
                    });
                });
            },
            views: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return null;
                return ViewService.getDocumentViews(document.sysmlid, false, workspace, time, true);
            },
            viewElements: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },    
            view: function(ViewService, workspace, document, time, dummyLogin) {
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
            document: function($stateParams, ElementService, workspace, time, dummyLogin) {
                return ElementService.getElement($stateParams.document, false, workspace, time);
            },
            views: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return null;
                return ViewService.getDocumentViews(document.sysmlid, false, workspace, time, true);
            },
            viewElements: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlid, false, workspace, time);
            },    
            view: function(ViewService, workspace, document, time, dummyLogin) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlid, false, workspace, time);
            },
            snapshot: function(configSnapshots, document, dummyLogin) {
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
            document: function($stateParams, ElementService, time, dummyLogin) {
                return ElementService.getElement($stateParams.document, false, $stateParams.workspace, time);
            },
            views: function($stateParams, ViewService, document, time, dummyLogin) {
                if (document.specialization.type !== 'Product')
                    return [];
                return ViewService.getDocumentViews($stateParams.document, false, $stateParams.workspace, time, true);
            },
            viewElements: function($stateParams, ViewService, time, dummyLogin) {
                return ViewService.getViewElements($stateParams.document, false, $stateParams.workspace, time);
            },
            view: function($stateParams, ViewService, viewElements, time, dummyLogin) {
                return ViewService.getView($stateParams.document, false, $stateParams.workspace, time);
            },
            snapshots: function(ConfigService, workspace, site, document, dummyLogin) {
                if (document.specialization.type !== 'Product')
                    return [];
                return ConfigService.getProductSnapshots(document.sysmlid, site.sysmlid, workspace);
            },
            snapshot: function(configSnapshots, document, dummyLogin) {
                var docid = document.sysmlid;
                var found = null;
                configSnapshots.forEach(function(snapshot) {
                    if (docid === snapshot.sysmlid)
                        found = snapshot;
                });
                return found; 
            },
            tag: function ($stateParams, ConfigService, workspace, snapshots, dummyLogin) {
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
            configSnapshots: function(ConfigService, workspace, tag, dummyLogin) {
                if (tag.timestamp === 'latest')
                    return [];
                return ConfigService.getConfigSnapshots(tag.id, workspace, false);
            },
            time: function($stateParams, ConfigService, workspace, dummyLogin) {
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
            docFilter: function($stateParams, ElementService, workspace, site, time, growl, dummyLogin) {
                //need to redefine here since time is redefined
                return ElementService.getElement("master_filter", false, workspace, time)
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
                controller: function ($scope, $filter, $rootScope, workspace, site, document, tag, snapshots, time, docFilter) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                    $scope.document = document;

                    $scope.showTag = true;
                    $rootScope.mms_title = 'View Editor: '+document.name;
                    var filtered = {};
                    if (docFilter)
                        filtered = JSON.parse(docFilter.documentation);

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
            viewElements: function($stateParams, ViewService, time, dummyLogin) {
                if (time === 'latest')
                    return ViewService.getViewElements($stateParams.view, false, $stateParams.workspace, time);
                return [];
            },
            view: function($stateParams, ViewService, viewElements, time, dummyLogin) {
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
            diff: function($stateParams, WorkspaceService, dummyLogin) {
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