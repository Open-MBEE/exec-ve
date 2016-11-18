'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'app.tpls', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'diff-match-patch', 'ngCookies'])
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
    // Change the DEFAULT state to workspace.sites on entry
    //$urlRouterProvider.when('', '/workspaces/master/sites');
    //$urlRouterProvider.when('', '/login');
    
    $urlRouterProvider.rule(function ($injector, $location) {
    // determine if the url is older 2.0 format (will not have a workspace)
         // generate some random client id
         var locationPath = $location.url();
         /*
         if (locationPath.indexOf('/workspaces') === -1 && locationPath.indexOf('/login') === -1 && locationPath !== '' && locationPath !== '/')
         {
             locationPath = 'workspaces/master' + locationPath;
 
             var queryParams = '';
             var pathArr = locationPath.split('/');
             // var diff = '';
 
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
 
             //$location.url(locationPath);
         }
         */
         if (locationPath.indexOf('full%23') > 0)
             locationPath = locationPath.replace('full%23', 'full#');
         if (locationPath[0] !== '/')
             locationPath = '/' + locationPath;
         if (locationPath !== $location.url())
             $location.url(locationPath);
     });
        /*var $window = $injector.get('$window');
        var loggedIn = $window.localStorage.getItem('ticket');
        var path = $location.path(), normalized = path.toLowerCase();
        if (!loggedIn && path.indexOf('login') === -1) {
            $location.path('/login');
        }
    });*/
    $urlRouterProvider.otherwise('/workspaces/master/sites');// when the url isn't mapped go here
    $httpProvider.defaults.withCredentials = true;
    $stateProvider
    .state('login', {
        url: '/login',
        resolve: { },
        views: {
            'pane-center': {
                templateUrl: 'partials/mms/login.html',
                controller: function ($scope, $rootScope, $state, $http, AuthService, growl) {
                    $scope.credentials = {
                      username: '',
                      password: ''
                    };
                    $rootScope.mms_title = 'View Editor: Login';
                    $scope.spin = false;
                    $scope.login = function (credentials) {
                      $scope.spin = true;
                      var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                          AuthService.getAuthorized(credentialsJSON).then(function (user) {
                            if ($rootScope.mmsRedirect) {
                                var toState = $rootScope.mmsRedirect.toState;
                                var toParams = $rootScope.mmsRedirect.toParams;
                                $state.go(toState, toParams);
                            } else {
                              $state.go('workspace.sites', {workspace: 'master'});
                            }
                          }, function (reason) {
                            $scope.spin = false;
                                growl.error(reason.message);
                          });
                    };
                }   
            },
            //'menu':{
             //   template: '<p class="pull-left" style="font-weight: 200; line-height: 1.28571em; padding-left:10px;">View Editor</p>'
            //}
        }
    })
    .state('workspaces', {
        url: '/workspaces?search',
        //parent: login, remove ticket to parent
        resolve: {
            // dummyLogin: function($http, URLService) {
            //     //login redirect if no ticket, otherwise okay
            //     // url service append ticket
            //     return $http.get(URLService.getCheckLoginURL());
            // },
            ticket: function($window, URLService, AuthService, $location, $q, $http, growl, ApplicationService, $cookies) {
                var deferred = $q.defer();
                AuthService.checkLogin().then(function(data) {
                    ApplicationService.setUserName(data);
                    URLService.setTicket($window.localStorage.getItem('ticket'));
                    deferred.resolve($window.localStorage.getItem('ticket'));
                    $http.post('/Basic/mms/cookieAuth?op=Sign In&username='+data).then(
                        function(data2){
                            $cookies.put('com.tomsawyer.web.license.user', data);
                        }, function(reason) {
                            growl.error("TSP license can not be activated: " + reason.message);
                        }
                    );
                }, function(rejection) {
                    //$location.path('/login');
                    deferred.reject(rejection);
                });
                return deferred.promise;
                //return URLService.setTicket($window.localStorage.getItem('ticket'));
            },
            workspaces: function(WorkspaceService, ticket) {
                return WorkspaceService.getWorkspaces();
            },
            workspace: function (ticket) {
                return 'master';
            },
            workspaceObj: function (WorkspaceService, workspace, ticket) {
                // TODO; replace workspace with workspaceObj, but first all controllers
                // need to be adapted to handle workspace as an object and not a string
                return WorkspaceService.getWorkspace(workspace);
            },  
            tags: function(ConfigService, workspace, ticket) {
                return ConfigService.getConfigs(workspace, false, 2);
            },
            tag: function ($stateParams, ConfigService, workspace, ticket) {
                return { name: 'latest', _timestamp: 'latest', commitId: 'latest'};
            },  
            sites: function(SiteService, ticket) {                 
               return SiteService.getSites();
            },
            site: function(SiteService, ticket) {
                return SiteService.getSite('no_site');
            },
            document : function(ElementService, workspace, commit, growl, ticket) {
                return null;
            },
            views: function(ticket) {
                return [];
            },
            view: function(ticket) {
                return null;
            },
            viewElements: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlId, false, workspace, commit, 2);
            },   
            commit: function(tag, ticket) {
                return tag.commitId;
            },
            search: function($stateParams, ElementService, workspace, ticket) {
                if ($stateParams.search === undefined) {
                    return null;
                }
                return ElementService.search($stateParams.search, ['*'], null, 0, 50, false, workspace, 2)
                .then(function(data) {
                    return data;
                }, function(reason) {
                    return null;
                });                
            }
        },
        views: {
            'nav': {
                template: '<mms-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="tag"></mms-nav>',
                controller: function ($scope, $rootScope, workspace, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                }
            },
            'menu': {
                template: '<mms-menu mms-title="Model Manager" mms-ws="{{workspace}}" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></mms-menu>',
                controller: function ($scope, $rootScope, workspaces, workspace, tags, tag) {
                    $scope.workspaces = workspaces;
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.tags = tags;
                    $rootScope.mms_title = 'View Editor: Model Manager';
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
            workspaceObj: function (WorkspaceService, workspace, ticket) {
                return WorkspaceService.getWorkspace(workspace);
            },
            sites: function(SiteService, commit, ticket) {                 
                if (commit === 'latest')
                    return SiteService.getSites();
                return SiteService.getSites(commit);
            },
            site: function(SiteService, ticket) {
                return SiteService.getSite('no_site');
            },
            document : function(ViewService, ElementService, $q, workspace, commit, growl, workspaceObj, ticket) {
            
                // This is a short-term work-around -- all this should be done the back-end MMS in the future
                var wsCoverDocId = 'master_cover';
                var deferred = $q.defer();
                ElementService.getElement(wsCoverDocId, false, workspace, commit, 2, true)
                .then(function(data) {
                    deferred.resolve(data);
                }, function(reason) {
                    if (reason.status === 401) {
                        deferred.reject(reason);
                        return;
                    }
                    // if it is an error, other than a 404 (element not found) then stop and return
                    if ((reason.status !== 404 && reason.status !== 410) || commit !== 'latest') {
                        deferred.resolve(null);
                        return;
                    }

                    var viewName = 'Workspace ' + workspaceObj.name + ' Cover Page';

                    ViewService.createView(undefined, viewName, undefined, workspace, wsCoverDocId)
                    .then(function(data) {
                        deferred.resolve(data);
                    }, function(reason) {
                        deferred.resolve(null);
                    });
                });
                return deferred.promise;
            },
            views: function(ViewService, workspace, document, commit, ticket) {
                return [];
            },
            viewElements: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return [];
                return ViewService.getViewElements(document.sysmlId, false, workspace, commit, 2);
            },    
            view: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlId, false, workspace, commit, 2, true);
            },
            tags: function(ConfigService, workspace, ticket) {
                return ConfigService.getConfigs(workspace, false, 2);
            },
            tag: function ($stateParams, ConfigService, workspace, ticket) {
                if ($stateParams.tag === undefined || $stateParams.tag === 'latest')
                    return { name: 'latest', _timestamp: 'latest', commitId: 'latest'};
                return ConfigService.getConfig($stateParams.tag, workspace, false, 2);
            },        
            commit: function(tag, ticket) {
                return tag.commitId;
            }
        },
        views: {
            'menu@': {
                template: '<mms-menu mms-title="Model Manager" mms-ws="{{workspace}}" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></mms-menu>',
                controller: function ($scope, $rootScope, workspaces, workspace, tag, tags, workspaceObj) {
                    $scope.workspaces = workspaces;
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.tags = tags;
                    $rootScope.mms_title = 'View Editor: ' + workspaceObj.name;
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
    .state('workspace.sites', {//base
        url: '/sites',
        resolve: {
        },
        parent: 'workspace',
        views: {
            'menu@': {
                template: '<mms-menu mms-title="Portal" mms-ws="{{workspace}}" mms-site="site" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></mms-menu>',
                controller: function ($scope, $rootScope, workspaces, workspace, site, tag, tags, workspaceObj) {
                    $scope.workspaces = workspaces;
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.tags = tags;
                    $scope.site = site;
                    $rootScope.mms_title = 'View Editor: Sites';
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
            site: function($stateParams, SiteService, ticket) {
                return SiteService.getSite($stateParams.site);
            },
            document : function($stateParams, ViewService, ElementService, $q, workspace, site, commit, growl, ticket) {
                var siteCoverDocId;
                if ($stateParams.site === 'no_site')
                    return null;
                    //siteCoverDocId = 'master_cover';
                else
                    siteCoverDocId = site.sysmlId + '_cover';
                var deferred = $q.defer();
                ElementService.getElement(siteCoverDocId, false, workspace, commit, 2, true)
                .then(function(data) {
                    deferred.resolve(data);
                }, function(reason) {
                    if (reason.status === 401) {
                        deferred.reject(reason);
                        return;
                    }
                    // if it is an error, other than a 404 (element not found) then stop and return
                    if ((reason.status !== 404 && reason.status !== 410) || commit !== 'latest') {
                        deferred.resolve(null);
                        return;
                    }

                    var viewName = site.name + ' Cover Page';
                    var viewDoc = '<mms-site-docs data-mms-site="' + site.sysmlId + '">[cf:site docs]</mms-site-docs>';

                    ViewService.createView(undefined, viewName, undefined, workspace, siteCoverDocId, viewDoc, site.sysmlId)
                    .then(function(data) {
                        deferred.resolve(data);
                    }, function(reason) {
                        deferred.resolve(null);
                    });
                });
                return deferred.promise;
            },
            views: function(ViewService, workspace, document, commit, ticket) {
                return [];
            },
            viewElements: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlId, false, workspace, commit, 2);
            },    
            view: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlId, false, workspace, commit, 2, true);
            }
        },
        views: {
            'nav@': {
                template: '<mms-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="tag" mms-site="site"></mms-nav>',
                controller: function ($scope, $rootScope, workspace, tag, site) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                }
            },
            'menu@': {
                template: '<mms-menu mms-title="Portal" mms-ws="{{workspace}}" mms-site="site" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></mms-menu>',
                controller: function ($scope, $rootScope, workspaces, workspace, site, tag, tags, workspaceObj) {
                    $scope.workspaces = workspaces;
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.tags = tags;
                    $scope.site = site;
                    $rootScope.mms_title = 'View Editor: ' + site.name;
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
            document: function($stateParams, ElementService, workspace, commit, ticket) {
                return ElementService.getElement($stateParams.document, false, workspace, commit, 2, true);
            },
            views: function(ViewService, workspace, document, commit, ticket) {
                return [];
            },
            viewElements: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getViewElements(document.sysmlId, false, workspace, commit, 2);
            },    
            view: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.sysmlId, false, workspace, commit, 2, true);
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
        url: '/documents/:document',
        resolve: {
            document: function($stateParams, ElementService, commit, ticket) {
                return ElementService.getElement($stateParams.document, false, $stateParams.workspace, commit, 2, true);
            },
            views: function($stateParams, ViewService, UtilsService, document, commit, ticket) {
                if (!UtilsService.isView(document))
                    return [];
                if (UtilsService.isDocument(document) && document.view2view && document.view2view.length > 0)
                    return ViewService.getDocumentViews($stateParams.document, false, $stateParams.workspace, commit, true, 2);
                else
                    return ViewService.getDocumentViews($stateParams.document, false, $stateParams.workspace, commit, false, 2);
            },
            viewElements: function($stateParams, ViewService, commit, ticket) {
                return ViewService.getViewElements($stateParams.document, false, $stateParams.workspace, commit, 2);
            },
            view: function($stateParams, ViewService, viewElements, commit, ticket) {
                return ViewService.getView($stateParams.document, false, $stateParams.workspace, commit, 2, true);
            }
        },
        views: {
            'menu@': {
                template: '<mms-menu mms-title="View Editor" mms-ws="{{workspace}}" mms-site="site" mms-doc="document" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags" mms-snapshot-tag="{{snapshotTag}}" mms-show-tag="{{showTag}}"></mms-menu>',
                controller: function ($scope, $filter, $rootScope, workspaces, workspace, site, document, tag, tags) {
                    $scope.workspaces = workspaces;
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.tags = tags;
                    $scope.site = site;
                    $scope.document = document;

                    $scope.showTag = true;
                    $rootScope.mms_title = 'View Editor: '+document.name;
                    
                    var tagStr = '';
                    if (tag._timestamp !== 'latest') {
                        tagStr += '( <i class="fa fa-camera"></i> ' + $filter('date')(tag._timestamp, 'M/d/yy h:mm a') + ' )';
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
            viewElements: function($stateParams, ViewService, commit, ticket) {
                //if (time === 'latest')
                //    return ViewService.getViewElements($stateParams.view, false, $stateParams.workspace, time);
                return [];
            },
            view: function($stateParams, ViewService, viewElements, commit, ticket) {
                return ViewService.getView($stateParams.view, false, $stateParams.workspace, commit, 2);
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
            diff: function($stateParams, WorkspaceService, ticket) {
                return WorkspaceService.diff($stateParams.target, $stateParams.source, $stateParams.targetTime, $stateParams.sourceTime);
            },

            ws1: function( $stateParams, WorkspaceService, ticket){ //ws1:target because that's what DiffElementChangeController has
                return WorkspaceService.getWorkspace($stateParams.target); 
            },

            ws2: function( $stateParams, WorkspaceService, ticket){ //ws2:source because that's what DiffElementChangeController has
                return WorkspaceService.getWorkspace($stateParams.source);
            },

            ws1Configs: function($stateParams, ConfigService, ws1, ticket){
                return ConfigService.getConfigs(ws1.id, false, 2);
            },

            ws2Configs: function($stateParams, ConfigService, ws2, ticket){
                return ConfigService.getConfigs(ws2.id, false, 2);
            },

            targetName: function($stateParams, ws1, ws1Configs,ticket){
                var result = null;
                if(ws1.id === 'master'){
                    result = 'master';
                }
                else{
                    result= ws1.name; //for comparing tasks
                }
                ws1Configs.forEach(function(config){ //for comparing tags - won't go in if comparing on task level
                    if(config.timestamp === $stateParams.targetTime)
                        result = config.name;
                });
                return result;
            },

            sourceName: function($stateParams, ws2, ws2Configs,ticket){
                var result = null ;
                if(ws2.id === 'master'){
                    result = 'master';
                }
                else{
                    result= ws2.name; //for comparing tasks
                }
                ws2Configs.forEach(function(config){ //for comparing tags - won't go in if comparing on task level
                    if(config.timestamp === $stateParams.sourceTime)
                        result = config.name; 
                });
                return result;
            } 
        },
        views: {
            'menu@': {
                templateUrl: 'partials/mms/diff-nav.html',               
                controller: function ($scope, $rootScope,targetName, sourceName, $stateParams, $state, $uibModal){
                    $scope.targetName = targetName;
                    $scope.sourceName = sourceName;
                    $rootScope.mms_title = 'View Editor: Diff';

                    $scope.goBack = function () {
                        $uibModal.open({
                            templateUrl: 'partials/mms/cancelModal.html',
                            controller: function($scope, $uibModalInstance, $state) {      
                                $scope.close = function() {
                                    $uibModalInstance.close();
                                };
                                $scope.exit = function() {
                                    $state.go('workspace', {}, {reload:true});
                                    $uibModalInstance.close(); 
                                };
                            }
                        });
                    };
                }
            },
            'pane-left@': {
                templateUrl: 'partials/mms/diff-pane-left.html',
                controller: 'WorkspaceDiffChangeController'
            },
            'pane-center@': {
                templateUrl: 'partials/mms/diff-pane-center.html',
                controller: 'WorkspaceDiffElementViewController'
            },
            'pane-right@': {
                template: ''
            },
            'toolbar-right@': {
                template: '<mms-toolbar buttons="buttons" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }
        }
    });
    // anonymous factory intercepts requests
    $httpProvider.interceptors.push(function($q, $location, $rootScope, $injector) {
        return {
            'responseError': function(rejection) {
                if(rejection.status === 401){ //rejection.config.url
                    $rootScope.$broadcast("mms.unauthorized", rejection);
                    // var AuthService = $injector.get('AuthService');
                    // var isExpired = AuthService.checkLogin();
                    // isExpired.then(function(){
                    // }, function() {
                    //     $state.go("login", {notify: false});
                    // });//:TODO   
                }
                return $q.reject(rejection);
            }
        };
    });
})
.constant('mmsRootSites', []);