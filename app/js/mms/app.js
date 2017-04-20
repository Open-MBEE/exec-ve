'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'app.tpls', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'diff-match-patch'])
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

    
    $urlRouterProvider.rule(function ($injector, $location) {
         var locationPath = $location.url();
         if (locationPath.indexOf('full%23') > 0)
             locationPath = locationPath.replace('full%23', 'full#');
         if (locationPath[0] !== '/')
             locationPath = '/' + locationPath;
         if (locationPath !== $location.url())
             $location.url(locationPath);
     });

    $urlRouterProvider.otherwise('/login');// when the url isn't mapped go here

    $stateProvider
    .state('login', {
        url: '/login',
        resolve: { },
        views: {
            'login@': {
                templateUrl: 'partials/mms/login.html',
                controller: function ($scope, $rootScope, $state, AuthService, growl) {
                    $scope.credentials = {
                      username: '',
                      password: ''
                    };
                    $rootScope.ve_title = 'View Editor';
                    $scope.spin = false;
                    $scope.login = function (credentials) {
                        $scope.spin = true;
                        var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                        AuthService.getAuthorized(credentialsJSON)
                        .then(function(user) {
                            if ($rootScope.ve_redirect) {
                                var toState = $rootScope.ve_redirect.toState;
                                var toParams = $rootScope.ve_redirect.toParams;
                                $state.go(toState, toParams);
                            } else {
                                $state.go('login.select');
                            }
                        }, function (reason) {
                            $scope.spin = false;
                            growl.error(reason.message);
                        });
                    };
                }   
            }
        }
    })
    .state('login.select', {
        url: '/select',
        resolve: {
            ticket: function($window, URLService, AuthService, $q, ApplicationService) {
                var deferred = $q.defer();
                AuthService.checkLogin().then(function(data) {
                    ApplicationService.setUserName(data);
                    URLService.setTicket($window.localStorage.getItem('ticket'));
                    deferred.resolve($window.localStorage.getItem('ticket'));
                }, function(rejection) {
                    deferred.reject(rejection);
                });
                return deferred.promise;
            },
            orgObs: function($stateParams, ProjectService, ticket) { 
                return ProjectService.getOrgs();
            }
        },
        views: {
            'login@': {
                templateUrl: 'partials/mms/select.html',
                controller: function($scope, $rootScope, $state, orgObs, ProjectService, AuthService, growl) {
                    $rootScope.ve_title = 'View Editor'; //what to name this?
                    $scope.orgs = orgObs; 
                    var orgId, projectId;
                    $scope.selectOrg = function(org) {
                        if (org) {
                            orgId = org.id;
                            $scope.selectedOrg = org.name;
                            $scope.selectedProject = "";
                            ProjectService.getProjects(orgId).then(function(data){
                                $scope.projects = data;
                            });
                        }
                    };
                    $scope.selectProject = function(project) { 
                        if (project) {
                            $scope.selectedProject = project.name;
                            projectId = project.id;
                        }
                    };
                    $scope.spin = false; 
                    $scope.continue = function() {
                        $scope.spin = true;
                        if (orgId && projectId) {
                            $state.go('project.ref', {orgId: orgId, projectId: projectId, refId: 'master'});
                        }
                    };
                    $scope.logout = function() {
                        AuthService.logout().then(function() {
                            $state.go('login');
                        }, function() {
                            growl.error('You were not logged out');
                        });
                    };
                }
            }
        }
    })
    .state('project', { //TODO this will be the ui to diff and merge and manage refs
        url: '/projects/:projectId',
        resolve: {
            ticket: function($window, URLService, AuthService, $q, ApplicationService) {
                var deferred = $q.defer();
                AuthService.checkLogin().then(function(data) {
                    ApplicationService.setUserName(data);
                    URLService.setTicket($window.localStorage.getItem('ticket'));
                    deferred.resolve($window.localStorage.getItem('ticket'));
                }, function(rejection) {
                    deferred.reject(rejection);
                });
                return deferred.promise;
            },
            orgObs: function($stateParams, ProjectService, ticket) {
                return ProjectService.getOrgs();
            },
            projectOb: function($stateParams, ProjectService, ticket) {
                return ProjectService.getProject($stateParams.projectId);
            },
            projectObs: function($stateParams, ProjectService, ticket, projectOb) {
                return ProjectService.getProjects(projectOb.orgId);
            },
            orgOb: function(ProjectService, projectOb, ticket) {
                return ProjectService.getOrg(projectOb.orgId);
            },
            refObs: function($stateParams, ProjectService, ticket) {
                return ProjectService.getRefs($stateParams.projectId);
            },
            tagObs: function(refObs) {
                var ret = [];
                for (var i = 0; i < refObs.length; i++) {
                    if (refObs[i].type === "Tag")
                        ret.push(refObs[i]);
                }
                return ret;
            },
            branchObs: function(refObs) {
                var ret = [];
                for (var i = 0; i < refObs.length; i++) {
                    if (refObs[i].type === "Branch")
                        ret.push(refObs[i]);
                }
                return ret;
            },
            refOb: function() { return null;},
            tagOb: function() { return null;},
            branchOb: function() { return null;},
            documentOb: function(){ return null;},
            viewOb: function(){ return null;},
            search: function(){ return null;}
        },
        views: {
            'nav@': {
                template: '<ve-nav mms-title="ve_title" mms-org="org" mms-orgs="orgs" mms-project="project" mms-projects="projects" mms-ref="ref" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-search="search"></ve-nav>', 
                controller: function ($scope, $rootScope, orgOb, orgObs, projectOb, projectObs, refOb, branchOb, branchObs, tagOb, tagObs, search) {
                    $rootScope.ve_title = orgOb.name;
                    $scope.org = orgOb;
                    $scope.orgs = orgObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                    $scope.search = search;
                }
            },
            'menu@': {
                template: '<ve-menu mms-title="ve_title" mms-org="org" mms-project="project" mms-projects="projects" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags"></ve-menu>',
                controller: function ($scope, $rootScope, orgOb, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs) {
                    $rootScope.ve_title = orgOb.name;
                    $scope.org = orgOb;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.refs = refObs;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                }
            },
            'manageRefs@': {
                templateUrl: 'partials/mms/manage-refs.html',
                controller: 'RefsCtrl'
            }
        }
    })
    .state('project.ref', { //equivalent to old sites and documents page
        url: '/:refId?search',
        resolve: {
            refOb: function($stateParams, ProjectService, ticket) {
                return ProjectService.getRef($stateParams.refId, $stateParams.projectId);
            },
            tagOb: function(refOb) {
                if(refOb.type === "Tag")
                    return refOb;
                else {
                    return [];
                }
            },
            branchOb: function(refOb) {
                if(refOb.type === "Branch")
                    return refOb;
                else {
                    return [];
                }
            },
            groupObs: function($stateParams, ProjectService, ticket) {
                return ProjectService.getGroups($stateParams.projectId, $stateParams.refId);
            },
            // documentObs: function($stateParams, ViewService, ticket) {
            //     return ViewService.getProjectDocuments({
            //         projectId: $stateParams.projectId,
            //         refId: $stateParams.refId,
            //         extended: true
            //     }, 2);
            // },
            documentOb: function($stateParams, $q, ElementService, ViewService, refOb, projectOb, ticket) {
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
                                deferred.reject(reason2);
                            });
                        }
                    } else {
                        deferred.reject(reason);
                    }
                });
                return deferred.promise;
            },
            viewOb: function(documentOb) { 
                return documentOb;
            },
            search: function($stateParams, ElementService, ticket) {
                if ($stateParams.search === undefined) {
                    return null;
                }
                return ElementService.search({
                        projectId: $stateParams.projectId,
                        refId: $stateParams.refId
                    }, $stateParams.search, ['*'], null, 0, 50, 2)
                .then(function(data) {
                    return data;
                }, function(reason) {
                    return null;
                });
            }
        },
        views: {
            'nav@': {
                template: '<ve-nav mms-title="ve_title" mms-org="org" mms-orgs="orgs" mms-project="project" mms-projects="projects" mms-ref="ref" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-search="search"></ve-nav>', 
                controller: function ($scope, $rootScope, orgOb, orgObs, projectOb, projectObs, refOb, branchOb, branchObs, tagOb, tagObs, search) {
                    $rootScope.ve_title = orgOb.name;
                    $scope.org = orgOb;
                    $scope.orgs = orgObs;
                    $scope.project = projectOb;
                    $scope.projects = projectObs;
                    $scope.ref = refOb;
                    $scope.branch = branchOb;
                    $scope.branches = branchObs;
                    $scope.tag = tagOb;
                    $scope.tags = tagObs;
                    $scope.search = search;
                }
            },
            'menu@': {
                template: '<ve-menu mms-title="ve_title" mms-org="org" mms-ref="ref" mms-refs="refs" mms-groups="groups" mms-project="project" mms-projects="projects" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags"></ve-menu>',
                controller: function ($scope, $rootScope, orgOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs) {
                    $rootScope.ve_title = orgOb.name;
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
    .state('project.ref.manage', { //not needed right now, for managing mounts
        url: '/manage'
    })
    .state('project.ref.preview', {
        url: '/document/:documentId',
        resolve: {
            documentOb: function($stateParams, $q, ElementService, ViewService, refOb, ticket) {
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
                                ViewService.createView({
                                        _projectId: $stateParams.projectId, 
                                        _refId: $stateParams.refId,
                                        id: groupId
                                    },{
                                        viewName: 'Need to get package name Cover Page', 
                                        viewId: eid
                                    }, 2)
                                .then(function(data) {
                                    deferred.resolve(data);
                                }, function(reason2) {
                                    deferred.reject(reason2);
                                });
                            }
                        } else {
                            deferred.reject(reason);
                        }
                    });
                } else {
                    ElementService.getElement({
                        projectId: $stateParams.projectId,
                        refId: $stateParams.refId,
                        extended: true,
                        elementId: $stateParams.documentId
                    }, 2).then(function(data){
                        deferred.resolve(data);
                    }, function(reason) {
                        deferred.reject(reason);
                    });
                }
                return deferred.promise;
            },
            viewOb: function(documentOb) {
                return documentOb;
            },
            groupOb: function(groupObs, documentOb, ProjectService, ticket) {
                var group = null;
                if(documentOb) {
                    for(var i = 0; i < groupObs.length; i++) {
                        if(groupObs[i]._id == documentOb._groupId) {
                            group = groupObs[i];
                            break;
                        }
                    }
                }
                return group;
            }
        },
        views: {
            'menu@': {
                template: '<ve-menu mms-title="ve_title" mms-org="org" mms-ref="ref" mms-refs="refs" mms-group="group" mms-groups="groups" mms-project="project" mms-projects="projects" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags"></ve-menu>',
                controller: function ($scope, $rootScope, orgOb, groupOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs) {
                    $rootScope.ve_title = orgOb.name;
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
                }
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
            documentOb: function($stateParams, ElementService, ticket) {
                return ElementService.getElement({
                    projectId: $stateParams.projectId,
                    refId: $stateParams.refId,
                    extended: true,
                    elementId: $stateParams.documentId
                }, 2);
            },
            viewObs: function($stateParams, ViewService, ticket) {
                return [];
                /*return ViewService.getDocumentViews({
                    projectId: $stateParams.projectId,
                    refId: $stateParams.refId,
                    extended: true,
                    elementId: $stateParams.documentId
                }, 2);*/
            },
            viewOb: function(documentOb) {
                return documentOb;
            },
            groupOb: function(groupObs, documentOb, ProjectService, ticket) {
            var group = null;
            if(documentOb) {
                for(var i = 0; i < groupObs.length; i++) {
                    if(groupObs[i]._id == documentOb._groupId) {
                        group = groupObs[i];
                        break;
                    }
                }
            }
            return group;
            }
        },
        views: {
            'menu@': {
                template: '<ve-menu mms-title="ve_title" mms-org="org" mms-ref="ref" mms-refs="refs" mms-group="group" mms-groups="groups" mms-project="project" mms-projects="projects" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-document="document"></ve-menu>',
                controller: function ($scope, $rootScope, orgOb, groupOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs, documentOb) {
                    $rootScope.ve_title = orgOb.name;
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
    .state('project.ref.document.view', {
        url: '/views/:viewId',
        resolve: {
            viewOb: function($stateParams, ElementService, viewObs, ticket) {
                return ElementService.getElement({
                    projectId: $stateParams.projectId,
                    refId: $stateParams.refId,
                    extended: true,
                    elementId: $stateParams.viewId
                }, 2);
            },
            groupOb: function(groupObs, documentOb, ProjectService, ticket) {
                var group = null;
                if(documentOb) {
                    for(var i = 0; i < groupObs.length; i++) {
                        if(groupObs[i]._id == documentOb._groupId) {
                            group = groupObs[i];
                            break;
                        }
                    }
                }
                return group;
            }
        },
        views: {
            'menu@': {
                template: '<ve-menu mms-title="ve_title" mms-org="org" mms-group="group" mms-groups="groups" mms-project="project" mms-projects="projects" mms-ref="ref" mms-refs="refs" mms-branch="branch" mms-branches="branches" mms-tag="tag" mms-tags="tags" mms-document="document"></ve-menu>',
                controller: function ($scope, $rootScope, orgOb, groupOb, groupObs, projectOb, projectObs, refOb, refObs, branchOb, branchObs, tagOb, tagObs, documentOb) {
                    $rootScope.ve_title = orgOb.name;
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
                }
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

/*
    .state('workspaces', {
        url: '/workspaces?search',
        //parent: login, remove ticket to parent
        resolve: {
            // dummyLogin: function($http, URLService) {
            //     //login redirect if no ticket, otherwise okay
            //     // url service append ticket
            //     return $http.get(URLService.getCheckLoginURL());
            // },
            ticket: function($window, URLService, AuthService, $location, $q, ApplicationService) {
                var deferred = $q.defer();
                AuthService.checkLogin().then(function(data) {
                    ApplicationService.setUserName(data);
                    URLService.setTicket($window.localStorage.getItem('ticket'));
                    deferred.resolve($window.localStorage.getItem('ticket'));
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
                return ViewService.getViewElements(document.id, false, workspace, commit, 2);
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
                template: '<ve-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="tag"></ve-nav>',
                controller: function ($scope, $rootScope, workspace, tag) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                }
            },
            'menu': {
                template: '<ve-menu mms-title="Model Manager" mms-ws="{{workspace}}" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></ve-menu>',
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
                return ViewService.getViewElements(document.id, false, workspace, commit, 2);
            },    
            view: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.id, false, workspace, commit, 2, true);
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
                template: '<ve-menu mms-title="Model Manager" mms-ws="{{workspace}}" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></ve-menu>',
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
                template: '<ve-menu mms-title="Portal" mms-ws="{{workspace}}" mms-site="site" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></ve-menu>',
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
                    siteCoverDocId = site.id + '_cover';
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
                    var viewDoc = '<mms-site-docs data-mms-site="' + site.id + '">[cf:site docs]</mms-site-docs>';

                    ViewService.createView(undefined, viewName, undefined, workspace, siteCoverDocId, viewDoc, site.id)
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
                return ViewService.getViewElements(document.id, false, workspace, commit, 2);
            },    
            view: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.id, false, workspace, commit, 2, true);
            }
        },
        views: {
            'nav@': {
                template: '<ve-nav mms-title="Model Manager" mms-ws="{{workspace}}" mms-config="tag" mms-site="site"></ve-nav>',
                controller: function ($scope, $rootScope, workspace, tag, site) {
                    $scope.workspace = workspace;
                    $scope.tag = tag;
                    $scope.site = site;
                }
            },
            'menu@': {
                template: '<ve-menu mms-title="Portal" mms-ws="{{workspace}}" mms-site="site" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags"></ve-menu>',
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
                return ViewService.getViewElements(document.id, false, workspace, commit, 2);
            },    
            view: function(ViewService, workspace, document, commit, ticket) {
                if (document === null) 
                    return null;
                return ViewService.getView(document.id, false, workspace, commit, 2, true);
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
                template: '<ve-menu mms-title="View Editor" mms-ws="{{workspace}}" mms-site="site" mms-doc="document" mms-workspaces="workspaces" mms-config="tag" mms-tags="tags" mms-snapshot-tag="{{snapshotTag}}" mms-show-tag="{{showTag}}"></ve-menu>',
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
    });*/
    // anonymous factory intercepts requests
    $httpProvider.interceptors.push(function($q, $location, $rootScope, $injector) {
        return {
            'responseError': function(rejection) {
                if(rejection.status === 401){ //rejection.config.url
                    $rootScope.$broadcast("mms.unauthorized", rejection); 
                }
                return $q.reject(rejection);
            },
            response: function(response) {
                if (response.status === 202) {
                    $rootScope.$broadcast("mms.working", response);
                }
                response.status = 501;
                return response;
            }
        };
    });
});