'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'app.tpls', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'ngStorage', 'ngAnimate', 'ngPromiseExtras', 'ngCookies'])
.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$provide', 'URLServiceProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $httpProvider, $provide, URLServiceProvider, $locationProvider) {
    // override uibTypeaheadPopup functionality
    $provide.decorator('uibTypeaheadPopupDirective', ['$delegate', function($delegate) {
        var originalLinkFn = $delegate[0].link;
        $delegate[0].compile = function(tElem, tAttr) {
            return function newLinkFn(scope, elem, attr) {
                // fire the originalLinkFn
                originalLinkFn.apply($delegate[0], arguments);
                scope.selectActive = function(matchIdx) {
                    // added behavior
                    elem.children().removeClass('active');
                    // default behavior
                    scope.active = matchIdx;
                };
            };
        };
        // get rid of the old link function since we return a link function in compile
        delete $delegate[0].link;
        return $delegate;
    }]);

    $locationProvider.hashPrefix('');

    $urlRouterProvider.rule(function ($injector, $location) {
        var $state = $injector.get('$state');
        var locationPath = $location.url();
        if (locationPath.indexOf('full%23') > 0)
            locationPath = locationPath.replace('full%23', 'full#');
        if (locationPath[0] !== '/')
            locationPath = '/' + locationPath;
        if (locationPath[locationPath.length-1] == '/')
            locationPath = locationPath.substring(0, locationPath.length-1);

        // if loading 'full' route with an anchor id, switch to views route instead
        if ( $state.current.name === '' || $state.current.name === 'login.redirect' ) {
            var string = '/full#';
            var hash = $location.hash();
            var index = locationPath.indexOf(string);
            if ( index !== -1 && hash && !hash.endsWith('_pei')) {
                locationPath = locationPath.substr(0, index) + '/views/' + hash;
            }
        }
        if (locationPath !== $location.url())
            $location.url(locationPath);
    });

    if(window.__env.baseUrl) {
        URLServiceProvider.setBaseUrl(window.__env.baseUrl);
    }
    else {
        URLServiceProvider.setBaseUrl('');
    }

    if(window.__env.apiUrl) {
        URLServiceProvider.setMmsUrl(window.__env.apiUrl);
    }
    else {
        var mmsHost = window.location.protocol + '//' + window.location.host;
        URLServiceProvider.setMmsUrl(mmsHost);
    }




    $httpProvider.defaults.withCredentials = true;
// Check if user is logged in, if so redirect to select page otherwise go to login if the url isn't mapped
    $urlRouterProvider.otherwise(function($injector, $location) {
        var rootScopeSvc = $injector.get('RootScopeService');
        var $state = $injector.get('$state');
        var checkLogin = $injector.get('AuthService').checkLogin();
        if (checkLogin) {
            if ($location.url().includes('workspace')) {
                rootScopeSvc.veRedirectFromOld(true);
                rootScopeSvc.veCrushUrl($location.path());
                $state.go('login.redirect');
            } else {
                rootScopeSvc.veRedirectFromOld(false);
                $state.go('login.select');
            }
        } else {
            $state.go('login');
        }
    });


    $stateProvider
    .state('login', {
        url: '/login',
        resolve: {
            bannerOb: ['BrandingService', function(BrandingService) {
                return BrandingService.getBanner();
            }],
            loginBannerOb: ['BrandingService', function(BrandingService) {
                return BrandingService.getLoginBanner();
            }]
        },
        views: {
            'banner@': {
                template: '<ve-system-banner mms-banner="banner"></ve-system-banner>',
                controller: ['$scope', 'bannerOb', function($scope, bannerOb){
                    $scope.banner = bannerOb;
                }]
            },
            'login@': {
                templateUrl: 'partials/mms/login.html',
                controller: ['$scope', '$state', 'AuthService', 'loginBannerOb', 'RootScopeService', 'growl', function ($scope, $state, AuthService, loginBannerOb, RootScopeService, growl) {
                    const rootScopeSvc = RootScopeService;
                    $scope.credentials = {
                      username: '',
                      password: ''
                    };
                    rootScopeSvc.veTitle('Login');
                    $scope.pageTitle = 'View Editor';
                    $scope.loginBanner = loginBannerOb;
                    $scope.spin = false;
                    $scope.login = function (credentials) {
                        $scope.spin = true;
                        var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                        AuthService.getAuthorized(credentialsJSON)
                        .then(function(user) {
                            if (rootScopeSvc.veRedirect()) {
                                let veRedirect = rootScopeSvc.veRedirect();
                                var toState = veRedirect.toState.name;
                                var toParams = veRedirect.toParams;
                                $state.go(toState, toParams);
                            } else {
                                $state.go('login.select', {fromLogin: true});
                            }
                        }, function (reason) {
                            $scope.spin = false;
                            growl.error(reason.message);
                        });
                    };
                }]
            }
        }
    })
    .state('login.redirect', {
        url: '/redirect',
        resolve: {
            token: ['$window', 'URLService', 'AuthService', '$q', '$cookies', 'ApplicationService', function($window, URLService, AuthService, $q, $cookies, ApplicationService) {
                var deferred = $q.defer();
                AuthService.checkLogin().then(function(data) {
                    ApplicationService.setUserName(data);
                    URLService.setToken($window.localStorage.getItem('token'));
                    deferred.resolve($window.localStorage.getItem('token'));
                    $cookies.put('com.tomsawyer.web.license.user', data, {path: '/'});
                }, function(rejection) {
                    deferred.reject(rejection);
                });
                return deferred.promise;
            }]
        },
        views: {
            'login@': {
                templateUrl: 'partials/mms/redirect.html',
                controller: 'RedirectCtrl'
            }
        }
    })
    .state('login.select', {
        url: '/select?fromLogin',
        resolve: {
            token: ['$window', 'URLService', 'AuthService', '$q', 'ApplicationService', function($window, URLService, AuthService, $q, ApplicationService) {
                var deferred = $q.defer();
                AuthService.checkLogin().then(function(data) {
                    ApplicationService.setUserName(data);
                    URLService.setToken($window.localStorage.getItem('token'));
                    deferred.resolve($window.localStorage.getItem('token'));
                }, function(rejection) {
                    deferred.reject(rejection);
                });
                return deferred.promise;
            }],
            bannerOb: ['BrandingService', function(BrandingService) {
                return BrandingService.getBanner();
            }],
            loginBannerOb: ['BrandingService', function(BrandingService) {
                return BrandingService.getLoginBanner();
            }],
            orgObs: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService, token) {
                return ProjectService.getOrgs();
            }]
        },
        views: {
            'banner@': {
                template: '<ve-system-banner mms-banner="banner"></ve-system-banner>',
                controller: ['$scope', 'bannerOb', function($scope, bannerOb){
                    $scope.banner = bannerOb;
                }]
            },
            'login@': {
                templateUrl: 'partials/mms/select.html',
                controller: ['$scope', '$state', '$stateParams', 'orgObs', 'ProjectService', 'AuthService', 'RootScopeService', 'EventService', 'loginBannerOb', 'growl', '$localStorage', function($scope, $state, $stateParams, orgObs, ProjectService, AuthService, RootScopeService, EventService, loginBannerOb, growl, $localStorage) {
                    const rootScopeSvc = RootScopeService;
                    const eventSvc = EventService;
                    eventSvc.$init($scope);

                    rootScopeSvc.veTitle('View Editor'); //what to name this?

                    $scope.redirect_from_old = rootScopeSvc.veRedirectFromOld();
                    $scope.$on(rootScopeSvc.constants.VEREDIRECTFROMOLD, (data) => {
                        $scope.redirect_from_old = data;
                    });
                    RootScopeService.veTitle('Projects');
                    $scope.pageTitle = 'View Editor';
                    $scope.fromLogin = $stateParams.fromLogin;
                    $localStorage.$default({org: orgObs[0]});
                    $scope.loginBanner = loginBannerOb;
                    $scope.spin = false;
                    $scope.orgs = orgObs;
                    var orgId, projectId;
                    $scope.selectOrg = function(org) {
                        if (org) {
                            $localStorage.org = org;
                            orgId = org.id;
                            $localStorage.org.orgName = org.name;
                            $scope.selectedOrg = $localStorage.org.name;
                            $scope.selectedProject = ""; // default here?
                            ProjectService.getProjects(orgId).then(function(data){
                                $scope.projects = data;
                                if (data.length > 0) {
                                    if($localStorage.project && checkForProject(data, $localStorage.project) === 1){
                                        $scope.selectedProject = $localStorage.project.name;
                                        projectId = $localStorage.project.id;
                                    }else{
                                        $scope.selectProject(data[0]);
                                    }
                                }
                            });
                        }
                    };
                    $scope.selectProject = function(project) {
                        if (project) {
                            $localStorage.project = project;
                            $scope.selectedProject = $localStorage.project.name;
                            projectId = $localStorage.project.id;
                        }
                    };
                    if ($localStorage.org) {
                        $scope.selectOrg($localStorage.org);
                    }
                    var checkForProject = function(projectArray, project) {
                        for (var i = 0; i < projectArray.length; i++) {
                            if(projectArray[i].id === project.id){
                                return 1;
                            }
                        }
                        return 0;
                    };

                    $scope.continue = function() {
                        if (orgId && projectId) {
                            $scope.spin = true;
                            RootScopeService.veRedirectFromOld(false);
                            $state.go('project.ref', {orgId: orgId, projectId: projectId, refId: 'master'}).then(function(data) {
                            }, function(reject) {
                                $scope.spin = false;
                            });
                        }
                    };
                    $scope.logout = function() {
                        AuthService.logout().then(function() {
                            $state.go('login');
                        }, function() {
                            growl.error('You were not logged out');
                        });
                    };
                }]
            }
        }
    })
    .state('project', { //TODO this will be the ui to diff and merge and manage refs
        url: '/projects/:projectId',
        resolve: {
            token: ['$window', 'URLService', 'AuthService', '$q', 'ApplicationService', '$cookies', function($window, URLService, AuthService, $q, ApplicationService, $cookies) {
                var deferred = $q.defer();
                AuthService.checkLogin().then(function(data) {
                    ApplicationService.setUserName(data);
                    URLService.setToken($window.localStorage.getItem('token'));
                    deferred.resolve($window.localStorage.getItem('token'));
                    $cookies.put('com.tomsawyer.web.license.user', data, {path: '/'});
                }, function(rejection) {
                    deferred.reject(rejection);
                });
                return deferred.promise;
            }],
            //orgObs: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService, token) {
            //    return ProjectService.getOrgs();
            //}],
            projectOb: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService) {
                return ProjectService.getProject($stateParams.projectId);
            }],
            projectObs: ['$stateParams', 'ProjectService', 'token', 'projectOb', function($stateParams, ProjectService, token, projectOb) {
                return ProjectService.getProjects(projectOb.orgId);
            }],
            orgOb: ['ProjectService', 'projectOb', 'token', function(ProjectService, projectOb) {
                return ProjectService.getOrg(projectOb.orgId);
            }],
            refObs: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService) {
                return ProjectService.getRefs($stateParams.projectId);
            }],
            tagObs: ['refObs', function(refObs) {
                var ret = [];
                for (var i = 0; i < refObs.length; i++) {
                    if (refObs[i].type === "Tag")
                        ret.push(refObs[i]);
                }
                return ret;
            }],
            branchObs: ['refObs', function(refObs) {
                var ret = [];
                for (var i = 0; i < refObs.length; i++) {
                    if (refObs[i].type === "Branch")
                        ret.push(refObs[i]);
                }
                return ret;
            }],
            bannerOb: ['BrandingService', function(BrandingService) {
                return BrandingService.getBanner();
            }],
            refOb: function() { return null;},
            tagOb: function() { return null;},
            branchOb: function() { return null;},
            documentOb: function(){ return null;},
            viewOb: function(){ return null;},
            search: function(){ return null;}
        },
        views: {
            'banner@': {
                template: '<ve-system-banner mms-banner="banner"></ve-system-banner>',
                controller: ['$scope', 'bannerOb', function($scope, bannerOb){
                    $scope.banner = bannerOb;
                }]
            },
            'nav@': {
                template: '<ve-nav mms-title="ve_title" mms-org="org" mms-project="project" mms-projects="projects" mms-ref="ref" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-search="search"></ve-nav>',
                controller: ['$scope', 'orgOb', 'projectOb', 'projectObs', 'refOb', 'branchOb', 'branchObs', 'tagOb', 'tagObs', 'search', 'RootScopeService', function ($scope, orgOb, projectOb, projectObs, refOb, branchOb, branchObs, tagOb, tagObs, search, RootScopeService) {
                    RootScopeService.veTitle(orgOb.name);
                    $scope.org = orgOb;
                    //$scope.orgs = orgObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                    $scope.search = search;
                }]
            },
            'menu@': {
                template: '<ve-menu mms-org="org" mms-project="project" mms-projects="projects" mms-ref="ref" mms-refs="refs" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags"></ve-menu>',
                controller:['$scope', 'orgOb', 'projectOb', 'projectObs', 'refOb', 'refObs', 'branchOb', 'branchObs', 'tagOb', 'tagObs', 'RootScopeService', function ($scope, orgOb, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs, RootScopeService) {
                    RootScopeService.veTitle(projectOb.name);
                    $scope.org = orgOb;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.refs = refObs;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                }]
            },
            'manageRefs@': {
                templateUrl: 'partials/mms/manage-refs.html',
                controller: 'RefsCtrl'
            }
        }
    })
    .state('project.ref', { // equivalent to old sites and documents page
        url: '/:refId?search',
        resolve: {
            projectOb: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService, token) {
                return ProjectService.getProjectMounts($stateParams.projectId, $stateParams.refId);
            }],
            refOb: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService, token) {
                return ProjectService.getRef($stateParams.refId, $stateParams.projectId);
            }],
            tagOb: ['refOb', function(refOb) {
                if(refOb.type === "Tag")
                    return refOb;
                else {
                    return [];
                }
            }],
            branchOb: ['refOb', function(refOb) {
                if(refOb.type === "Branch")
                    return refOb;
                else {
                    return [];
                }
            }],
            groupObs: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService, token) {
                return ProjectService.getGroups($stateParams.projectId, $stateParams.refId);
            }],
            groupOb: function(){ return null;},
            documentOb: ['$stateParams', '$q', 'ElementService', 'ViewService', 'refOb', 'projectOb', 'token', function($stateParams, $q, ElementService, ViewService, refOb, projectOb, token) {
                var deferred = $q.defer();
                var eid = $stateParams.projectId + '_cover';
                ElementService.getElement({
                    projectId: $stateParams.projectId,
                    refId: $stateParams.refId,
                    extended: true,
                    elementId: eid
                }, 2).then(function(data) {
                    deferred.resolve(data);
                }, function(reason) {
                    if (reason.status === 404) {
                        if (refOb.type === 'Tag') {
                            deferred.resolve(null);
                        } else {
                            ViewService.createView({
                                _projectId: $stateParams.projectId,
                                _refId: $stateParams.refId,
                                id: 'holding_bin_' + $stateParams.projectId
                            },{
                                viewName: projectOb.name + ' Cover Page',
                                viewId: eid
                            }, 2).then(function(data) {
                                deferred.resolve(data);
                            }, function(reason2) {
                                deferred.resolve(null);
                            });
                        }
                    } else if (reason.status === 410) { //resurrect
                        var name = projectOb.name + ' Cover Page ';
                        try {
                            name = reason.data.deleted[0].name + ' ';
                        } catch(e) {}
                        ElementService.updateElements([
                            {
                                _projectId: $stateParams.projectId,
                                _refId: $stateParams.refId,
                                id: eid,
                                name: name
                            },
                            {
                                _projectId: $stateParams.projectId,
                                _refId: $stateParams.refId,
                                id: eid + "_asi",
                                name: ' '
                            }
                        ]).then(function(data) {
                            var resolved = false;
                            if (data.length > 0) {
                                data.forEach(function(e) {
                                    if (e.id == eid) {
                                        deferred.resolve(e);
                                        resolved = true;
                                    }
                                });
                            }
                            if (!resolved) {
                                deferred.resolve(null);
                            }
                        }, function(reason2) {
                            deferred.resolve(null);
                        });
                    } else {
                        deferred.resolve(null); //let user get into project
                    }
                });
                return deferred.promise;
            }],
            viewOb: ['documentOb', function(documentOb) {
                return documentOb;
            }],
            search: ['$stateParams', 'ElementService', 'token', function($stateParams, ElementService, token) {
                if ($stateParams.search === undefined) {
                    return null;
                }
                return $stateParams.search;
            }],
            bannerOb: ['BrandingService', function(BrandingService) {
                return BrandingService.getBanner();
            }],
            footerOb: ['BrandingService', function(BrandingService) {
                return BrandingService.getFooter();
            }],
            docMeta: [function(){
                return {};
            }],
            permissions: ['projectOb', 'refOb', 'PermissionsService', function(projectOb, refOb, PermissionsService){
                return PermissionsService.initializePermissions(projectOb, refOb);
            }]
        },
        views: {
            'banner@': {
                template: '<ve-system-banner mms-banner="banner"></ve-system-banner>',
                controller: ['$scope', 'bannerOb', function($scope, bannerOb){
                    $scope.banner = bannerOb;
                }]
            },
            'nav@': {
                template: '<ve-nav mms-title="ve_title" mms-org="org" mms-project="project" mms-projects="projects" mms-ref="ref" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-search="search"></ve-nav>',
                controller: ['$scope', 'orgOb', 'projectOb', 'projectObs', 'refOb', 'branchOb', 'branchObs', 'tagOb', 'tagObs', 'search', 'RootScopeService', function ($scope, orgOb, projectOb, projectObs, refOb, branchOb, branchObs, tagOb, tagObs, search, RootScopeService) {
                    RootScopeService.veTitle(orgOb.name);
                    $scope.org = orgOb;
                    //$scope.orgs = orgObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                    $scope.search = search;
                }]
            },
            'menu@': {
                template: '<ve-menu mms-org="org" mms-ref="ref" mms-refs="refs" mms-groups="groups" mms-project="project" mms-projects="projects" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags"></ve-menu>',
                controller: ['$scope', 'orgOb', 'groupObs', 'projectOb', 'projectObs', 'refOb', 'refObs', 'branchOb', 'branchObs', 'tagOb', 'tagObs', 'RootScopeService', function ($scope, orgOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs, RootScopeService) {
                    RootScopeService.veTitle(projectOb.name);
                    $scope.org = orgOb;
                    $scope.groups = groupObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.refs = refObs;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                }]
            },
            'pane-left@': {
                templateUrl: 'partials/mms/pane-left.html',
                controller: 'TreeCtrl',
                controllerAs: 'treeCtrl'
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
            },
            'footer@': {
                template: '<ve-footer mms-footer="footer"></ve-footer>',
                controller: ['$scope', 'footerOb', function ($scope, footerOb) {
                    $scope.footer = footerOb;
                }]
            }
        }
    })
    .state('project.ref.groupReorder', {
        url: '/group-reorder',
        resolve: {
            documentObs: ['ViewService', '$stateParams', 'token', function(ViewService, $stateParams, token) {
                return ViewService.getProjectDocuments({
                    projectId: $stateParams.projectId,
                    refId: $stateParams.refId
                });
            }]
        },
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/reorder-groups.html',
                controller: 'ReorderGroupCtrl'
            }
        }
    })
    .state('project.ref.manage', { //not needed right now, for managing mounts
        url: '/manage'
    })
    .state('project.ref.preview', {
        url: '/document/:documentId',
        resolve: {
            projectOb: ['$stateParams', 'ProjectService', 'token', function($stateParams, ProjectService, token) {
                return ProjectService.getProjectMounts($stateParams.projectId, $stateParams.refId);
            }],
            documentOb: ['$stateParams', '$q', 'ElementService', 'ViewService', 'refOb', 'token', function($stateParams, $q, ElementService, ViewService, refOb, token) {
                var deferred = $q.defer();
                var eid = $stateParams.documentId;
                var coverIndex = eid.indexOf('_cover');
                if (coverIndex > 0) {
                    var groupId = eid.substring(5, coverIndex);
                    ElementService.getElement({
                        projectId: $stateParams.projectId,
                        refId: $stateParams.refId,
                        extended: true,
                        elementId: eid
                    }, 2).then(function(data) {
                        deferred.resolve(data);
                    }, function(reason) {
                        if (reason.status === 404) {
                            if (refOb.type === 'Tag') {
                                deferred.resolve(null);
                            } else {
                                var viewDoc = '<mms-group-docs mms-group-id="' + groupId + '">[cf:group docs]</mms-group-docs>';
                                ElementService.getElement({projectId: $stateParams.projectId, refId: $stateParams.refId, elementId: groupId})
                                .then(function(groupElement) {
                                    ViewService.createView({
                                        _projectId: $stateParams.projectId,
                                        _refId: $stateParams.refId,
                                        id: groupId
                                    },{
                                        viewName: groupElement.name + ' Cover Page',
                                        viewId: eid
                                    }, viewDoc)
                                    .then(function(data) {
                                        deferred.resolve(data);
                                    }, function(reason3) {
                                        deferred.resolve(null);
                                    });
                                }, function(reason2) {
                                    deferred.resolve(null);
                                });
                            }
                        } else {
                            deferred.reject(reason);
                        }
                    });
                } else {
                    ViewService.getProjectDocument({
                        projectId: $stateParams.projectId,
                        refId: $stateParams.refId,
                        extended: false,
                        documentId: $stateParams.documentId
                    }, 2).then(function(data){
                        deferred.resolve(data);
                    }, function(reason) {
                        deferred.reject(reason);
                    });
                }
                return deferred.promise;
            }],
            viewOb: ['documentOb', function(documentOb) {
                return documentOb;
            }],
            groupOb: ['groupObs', 'documentOb', 'ProjectService', 'token', function(groupObs, documentOb, ProjectService, token) {
                var group = null;
                if (documentOb) {
                    for (var i = 0; i < groupObs.length; i++) {
                        if (groupObs[i].id == documentOb._groupId) {
                            group = groupObs[i];
                            break;
                        }
                    }
                }
                return group;
            }]
        },
        views: {
            'menu@': {
                template: '<ve-menu mms-org="org" mms-ref="ref" mms-refs="refs" mms-group="group" mms-groups="groups" mms-project="project" mms-projects="projects" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags"></ve-menu>',
                controller: ['$scope', 'orgOb', 'groupOb', 'groupObs', 'projectOb', 'projectObs', 'refOb', 'refObs', 'branchOb', 'branchObs', 'tagOb', 'tagObs', 'documentOb', 'RootScopeService', function ($scope, orgOb, groupOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs, documentOb, RootScopeService) {
                    RootScopeService.veTitle(documentOb.name);
                    $scope.org = orgOb;
                    $scope.ref = refOb;
                    $scope.group = groupOb;
                    $scope.groups = groupObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.refs = refObs;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                }]
            },
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            },
            'pane-right@': {
                templateUrl: 'partials/mms/pane-right.html',
                controller: 'ToolCtrl'
            }
        }
    })
    .state('project.ref.document', {
        url: '/documents/:documentId',
        resolve: {
            documentOb: ['$stateParams', 'ViewService', 'token', function($stateParams, ViewService) {
                return ViewService.getProjectDocument({
                    projectId: $stateParams.projectId,
                    refId: $stateParams.refId,
                    extended: false,
                    documentId: $stateParams.documentId
                }, 2);
            }],
            viewOb: ['documentOb', function(documentOb) {
                return documentOb;
            }],
            groupOb: ['groupObs', 'documentOb', function(groupObs, documentOb) {
                var group = null;
                if (documentOb) {
                    for (var i = 0; i < groupObs.length; i++) {
                        if (groupObs[i].id == documentOb._groupId) {
                            group = groupObs[i];
                            break;
                        }
                    }
                }
                return group;
            }],
            docMeta: ['ViewService', 'documentOb', function(ViewService, documentOb) {
                return ViewService.getDocMetadata({
                    projectId: documentOb._projectId,
                    refId: documentOb._refId,
                    elementId: documentOb.id
                });
            }]
        },
        views: {
            'menu@': {
                template: '<ve-menu mms-org="org" mms-ref="ref" mms-refs="refs" mms-group="group" mms-groups="groups" mms-project="project" mms-projects="projects" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-document="document"></ve-menu>',
                controller: ['$scope', 'orgOb', 'groupOb', 'groupObs', 'projectOb', 'projectObs', 'refOb', 'refObs', 'branchOb', 'branchObs', 'tagOb', 'tagObs', 'documentOb', 'RootScopeService', function ($scope, orgOb, groupOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs, documentOb, RootScopeService) {
                    RootScopeService.veTitle(documentOb.name);
                    $scope.org = orgOb;
                    $scope.group = groupOb;
                    $scope.groups = groupObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.refs = refObs;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                    $scope.document = documentOb;
                }]
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
    .state('project.ref.document.view', {
        url: '/views/:viewId',
        resolve: {
            viewOb: ['$stateParams', 'ElementService', 'token', function($stateParams, ElementService, token) {
                return ElementService.getElement({
                    projectId: $stateParams.projectId,
                    refId: $stateParams.refId,
                    elementId: $stateParams.viewId
                }, 2);
            }],
            groupOb: ['groupObs', 'documentOb', function(groupObs, documentOb) {
                var group = null;
                if (documentOb) {
                    for (var i = 0; i < groupObs.length; i++) {
                        if (groupObs[i].id == documentOb._groupId) {
                            group = groupObs[i];
                            break;
                        }
                    }
                }
                return group;
            }]
        },
        views: {
            'menu@': {
                template: '<ve-menu mms-org="org" mms-group="group" mms-groups="groups" mms-project="project" mms-projects="projects" mms-ref="ref" mms-refs="refs" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-document="document" mms-view="view"></ve-menu>',
                controller: ['$scope', 'orgOb', 'groupOb', 'groupObs', 'projectOb', 'projectObs', 'refOb', 'refObs', 'branchOb', 'branchObs', 'tagOb', 'tagObs', 'documentOb', 'viewOb', 'RootScopeService', function ($scope, orgOb, groupOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs, documentOb, viewOb, RootScopeService) {
                    RootScopeService.veTitle(documentOb.name);
                    $scope.org = orgOb;
                    $scope.group = groupOb;
                    $scope.groups = groupObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.refs = refObs;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                    $scope.document = documentOb;
                    $scope.view = viewOb;
                }]
            },
            'pane-center@': {
                templateUrl: 'partials/mms/pane-center.html',
                controller: 'ViewCtrl'
            }
        }
    })
    .state('project.ref.document.order', {
        url: '/order',
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/reorder-views.html',
                controller: 'ReorderCtrl'
            }
        }
    })
    .state('project.ref.document.full', {
        url: '/full',
        views: {
            'pane-center@': {
                templateUrl: 'partials/mms/full-doc.html',
                controller: 'FullDocCtrl'
            }
        }
    });

    // anonymous factory intercepts requests
    $httpProvider.interceptors.push(['$q', '$location', '$injector', 'URLService', 'EventService', function($q, $location, $injector, URLService, EventService) {
        return {
            request: function(config) {
                config.headers = URLService.getAuthorizationHeader(config.headers);
                return config;
            },
            'responseError': function(rejection) {
                if(rejection.status === 401){ //rejection.config.url
                    EventService.$broadcast("mms.unauthorized", rejection);
                }
                return $q.reject(rejection);
            },
            response: function(response) {
                if (response.status === 202) {
                    EventService.$broadcast("mms.working", response);
                }
                response.status = 501;
                return response;
            }
        };
    }]);

    $httpProvider.useApplyAsync(true);
}]);
