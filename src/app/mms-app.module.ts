import * as angular from 'angular';
import uiRouter, {Transition, StateService} from "@uirouter/angularjs";
import {StateProvider, UIRouter, TransitionService, UrlParts} from "@uirouter/angularjs";
import {IHttpProvider, ILocationProvider, ILocationService} from "angular";
import {RootScopeService} from "../mms/services/RootScopeService.service";
import {AuthService} from "../mms/services/AuthorizationService.service";
import {URLService, URLServiceProvider} from "../mms/services/URLService.provider";
import {ResolveService} from "./services/Resolve.service";
import {ngStorage} from "ngstorage";
import {ProjectService} from "../mms/services/ProjectService.service";
import {HttpService} from "../mms/services/HttpService.service";
import {EventService} from "../mms/services/EventService.service";
import {ApplicationService} from "../mms/services/ApplicationService.service";

var mmsApp = angular.module('mmsApp', ['mms', 'mmsDirectives', 'ui.bootstrap', uiRouter, 'ui.tree', 'angular-growl', 'angular-flatpickr', 'rx', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'ngStorage', 'ngAnimate', 'ngPromiseExtras', 'ngCookies']);
//var mmsApp = angular.module('mmsApp', ['mms', 'mmsDirectives', 'fa.directive.borderLayout', 'ui.bootstrap', uiRouter.default, 'ui.tree', 'angular-growl', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'ngStorage', 'ngAnimate', 'ngPromiseExtras', 'ngCookies']);

mmsApp.config(['$stateProvider', '$uiRouterProvider', '$transitionsProvider', '$httpProvider', '$provide', 'URLServiceProvider', '$locationProvider', function($stateProvider: StateProvider, $uiRouterProvider : UIRouter, $transitionsProvider: TransitionService, $httpProvider : angular.IHttpProvider, $provide : angular.auto.IProvideService, $urlServiceProvider: URLServiceProvider, $locationProvider : ILocationProvider) {
    // override uibTypeaheadPopup functionality
    $provide.decorator('uibTypeaheadPopupDirective', ['$delegate', function ($delegate) {
        var originalLinkFn = $delegate[0].link;
        $delegate[0].compile = function (tElem, tAttr) {
            return function newLinkFn(scope, elem, attr) {
                // fire the originalLinkFn
                originalLinkFn.apply($delegate[0], arguments);
                scope.selectActive = function (matchIdx) {
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


    if (window.__env.baseUrl) {
        $urlServiceProvider.setBaseUrl(window.__env.baseUrl);
    } else {
        $urlServiceProvider.setBaseUrl('');
    }

    if (window.__env.apiUrl) {
        $urlServiceProvider.setMmsUrl(window.__env.apiUrl);
    } else {
        var mmsHost = window.location.protocol + '//' + window.location.host;
        $urlServiceProvider.setMmsUrl(mmsHost);
    }


    $httpProvider.defaults.withCredentials = true;


    $stateProvider
        .state('main', {
            component: 'main'
        })
        .state('main.login', {
            url: '/login',
            resolve: {
                bannerOb: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getBanner();
                }],
                loginBannerOb: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getLoginBanner();
                }],
            },
            views: {
                'banner@main': {
                    component: 'veSystemBanner'
                },
                'login@main': {
                    component: 'login',
                    bindings: {
                        mmsLoginBanner: 'loginBannerOb'
                    }
                }
            }
        })
        .state('main.login.redirect', {
            url: '/redirect',
            resolve: {
                token: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getToken();
                }],
            },
            views: {
                'login@main': {
                    component: 'veRedirect'
                }
            }
        })
        .state('main.login.select', {
            url: '/select?fromLogin',
            resolve: {
                // token: ['ResolveService', function(resolveSvc: ResolveService) {
                //     return resolveSvc.getToken();
                // }],
                bannerOb: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getBanner();
                }],
                loginBannerOb: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getLoginBanner();
                }],
                orgObs: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getOrgs();
                }]
            },
            views: {
                'banner@main': {
                    component: 'veSystemBanner'
                },
                'login@main': {
                    component: 'projectSelect',
                    bindings: {
                        mmsOrgs: 'orgObs',
                        mmsLoginBanner: 'loginBannerOb'
                    }
                }
            }
        })
        .state('main.project', { //TODO this will be the ui to diff and merge and manage refs
            url: '/projects/:projectId'
        })
        .state('main.project.ref', { // equivalent to old sites and documents page
            url: '/:refId?search',
            resolve: {
                projectOb: ['ResolveService', '$transition$', (resolveSvc: ResolveService, $transition$: Transition) => {
                    return resolveSvc.getProjectMounts($transition$);
                }],
                projectObs: ['ProjectService', 'projectOb', (projectSvc: ProjectService, projectOb) => {
                    return projectSvc.getProjects(projectOb.orgId);
                }],
                refOb: ['ProjectService', '$transition$', (projectSvc: ProjectService, $transition$: Transition) => {
                    let params = $transition$.params();
                    return projectSvc.getRef(params.refId, params.projectId);
                }],
                tagOb: ['refOb', 'ResolveService', (refOb, resolveSvc: ResolveService) => {
                    return resolveSvc.getTag(refOb);
                }],
                branchOb: ['refOb', 'ResolveService', (refOb, resolveSvc: ResolveService) => {
                    return resolveSvc.getBranch(refOb);
                }],
                groupOb: () => {
                    return null;
                },
                groupObs: ['ResolveService', '$transition$', (resolveSvc: ResolveService, $transition$: Transition) => {
                    return resolveSvc.getGroups($transition$);
                }],
                documentOb: ['$transition$', 'refOb', 'projectOb', 'ResolveService', ($transition$: Transition, refOb, projectOb, resolveSvc: ResolveService) => {
                    return resolveSvc.getDocument($transition$, refOb, projectOb);
                }],
                viewOb: ['documentOb', (documentOb) => {
                    return documentOb;
                }],
                search: ['ResolveService', '$transition$', (resolveSvc: ResolveService, $transition$: Transition) => {
                    return resolveSvc.getSearch($transition$)
                }],
                bannerOb: ['ResolveService', (resolveSvc: ResolveService) => {
                    return resolveSvc.getBanner();
                }],
                footerOb: ['ResolveService', (resolveSvc: ResolveService) => {
                    return resolveSvc.getFooter();
                }],
                docMeta: () => {
                    return {};
                },
                permissions: ['refOb', 'projectOb', 'ResolveService', (refOb, projectOb, resolveSvc: ResolveService) => {
                    return resolveSvc.initializePermissions(projectOb, refOb);
                }]
            },
            views: {
                'banner@main': {
                    component: 'veSystemBanner'
                },
                'nav@main': {
                    component: 'veNav',
                    bindings: {
                        mmsProject: 'projectOb',
                        mmsProjects: 'projectObs',
                        mmsRef: 'refOb',
                    }
                },
                'menu@main': {
                    component: 'veMenu',
                    bindings: {
                        mmsProject: 'projectOb',
                        mmsProjects: 'projectObs',
                        mmsGroup: 'groupOb',
                        mmsGroups: 'groupObs',
                        mmsBranch: 'branchOb',
                        mmsRef: 'refOb',
                        mmsTag: 'tagOb',
                        mmsDocument: 'documentOb',
                        mmsView: 'viewOb'
                    }
                },
                'pane-left@main': {
                    component: 'leftPane',
                    bindings: {
                        mmsDocument: 'documentOb',
                        mmsOrg: 'orgOb',
                        mmsProject: 'projectOb',
                        mmsRef: 'refOb',
                        mmsRefs: 'refObs',
                        mmsGroups: 'groupObs'
                    },
                },
                'pane-center@main': {
                    component: 'view'
                },
                'pane-right@main': {
                    component: 'rightPane'
                },
                'toolbar-right@main': {
                    component: 'toolbar'
                },
                'footer@main': {
                    component: 'veFooter'
                }
            }
        })
        .state('main.project.ref.groupReorder', {
            url: '/group-reorder',
            resolve: {
                documentObs: ['ViewService', '$transition$', 'token', function (ViewService, $transition$) {
                    let params = $transition$.params();
                    return ViewService.getProjectDocuments({
                        projectId: params.projectId,
                        refId: params.refId
                    });
                }]
            },
            views: {
                'pane-center@main': {
                    templateUrl: 'partials/mms/reorder-groups.html',
                    controller: 'ReorderGroupCtrl'
                }
            }
        })
        .state('main.project.ref.manage', { //not needed right now, for managing mounts
            url: '/manage'
        })
        .state('main.project.ref.preview', {
            url: '/document/:documentId',
            resolve: {
                projectOb: ['ResolveService', '$transition$', (resolveSvc: ResolveService, $transition$: Transition) => {
                    return resolveSvc.getProjectMounts($transition$);
                }],
                documentOb: ['ResolveService', '$transition$', 'refOb', (resolveSvc: ResolveService, $transition$: Transition, refOb) => {
                    return resolveSvc.getDocumentPreview($transition$, refOb)
                }],
                viewOb: ['documentOb', (documentOb) => {
                    return documentOb;
                }],
                groupOb: ['groupObs', 'documentOb', (groupObs, documentOb) => {
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
                'menu@main': {
                    component: 'veMenu',
                    bindings: {
                        mmsProject: 'projectOb',
                        mmsProjects: 'projectObs',
                        mmsGroup: 'groupOb',
                        mmsGroups: 'groupObs',
                        mmsBranch: 'branchOb',
                        mmsRef: 'refOb',
                        mmsTag: 'tagOb',
                        mmsDocument: 'documentOb',
                        mmsView: 'viewOb'
                    }
                },
                'pane-center@main': {
                    component: 'view'
                },
                'pane-right@main': {
                    templateUrl: 'partials/mms/pane-right.html',
                    controller: 'ToolCtrl'
                }
            }
        })
        .state('main.project.ref.document', {
            url: '/documents/:documentId',
            resolve: {
                documentOb: ['$stateParams', 'ViewService', 'token', function ($stateParams, ViewService) {
                    return ViewService.getProjectDocument({
                        projectId: $stateParams.projectId,
                        refId: $stateParams.refId,
                        extended: false,
                        documentId: $stateParams.documentId
                    }, 2);
                }],
                viewOb: ['documentOb', function (documentOb) {
                    return documentOb;
                }],
                groupOb: ['groupObs', 'documentOb', function (groupObs, documentOb) {
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
                docMeta: ['ViewService', 'documentOb', function (ViewService, documentOb) {
                    return ViewService.getDocMetadata({
                        projectId: documentOb._projectId,
                        refId: documentOb._refId,
                        elementId: documentOb.id
                    });
                }]
            },
            views: {
                'menu@main': {
                    component: 'veMenu',
                    bindings: {
                        mmsProject: 'projectOb',
                        mmsProjects: 'projectObs',
                        mmsGroup: 'groupOb',
                        mmsGroups: 'groupObs',
                        mmsBranch: 'branchOb',
                        mmsRef: 'refOb',
                        mmsTag: 'tagOb',
                        mmsTags: 'tagObs',
                        mmsDocument: 'documentOb',
                        mmsView: 'viewOb'
                    }
                },
                'pane-left@main': {
                    component: 'leftPane',
                    bindings: {
                        mmsDocument: 'documentOb',
                        mmsOrg: 'orgOb',
                        mmsProject: 'projectOb',
                        mmsRef: 'refOb',
                        mmsRefs: 'refObs',
                        mmsGroups: 'groupObs'
                    }
                },
                'pane-center@main': {
                    component: 'view'
                },
                'pane-right@main': {
                    templateUrl: 'partials/mms/pane-right.html',
                    controller: 'ToolCtrl'
                },
                'toolbar-right@main': {
                    component: 'toolbar'
                }
            }
        })
        .state('main.project.ref.document.view', {
            url: '/views/:viewId',
            resolve: {
                viewOb: ['$stateParams', 'ElementService', 'token', function ($stateParams, ElementService, token) {
                    return ElementService.getElement({
                        projectId: $stateParams.projectId,
                        refId: $stateParams.refId,
                        elementId: $stateParams.viewId
                    }, 2);
                }],
                groupOb: ['groupObs', 'documentOb', function (groupObs, documentOb) {
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
                'menu@main': {
                    component: 'veMenu',
                    bindings: {
                        mmsProject: 'projectOb',
                        mmsProjects: 'projectObs',
                        mmsGroup: 'groupOb',
                        mmsGroups: 'groupObs',
                        mmsBranch: 'branchOb',
                        mmsRef: 'refOb',
                        mmsTag: 'tagOb',
                        mmsTags: 'tagObs',
                        mmsDocument: 'documentOb',
                        mmsView: 'viewOb'
                    }
                },
                'pane-center@main': {
                    component: 'view'
                },
            }
        })
        .state('main.project.ref.document.order', {
            url: '/order',
            views: {
                'pane-center@main': {
                    templateUrl: 'partials/mms/reorder-views.html',
                    controller: 'ReorderCtrl'
                }
            }
        })
        .state('main.project.ref.document.full', {
            url: '/full',
            views: {
                'pane-center@main': {
                    component: 'fullDocument'
                }
            }
        });

    // anonymous factory intercepts requests
    $httpProvider.interceptors.push(['$q', '$location', '$injector', 'URLService', 'EventService', function ($q, $location, $injector, URLService, EventService) {
        return {
            request: function (config) {
                config.headers = URLService.getAuthorizationHeader(config.headers);
                return config;
            },
            'responseError': function (rejection) {
                if (rejection.status === 401) { //rejection.config.url
                    EventService.$broadcast("mms.unauthorized", rejection);
                }
                return $q.reject(rejection);
            },
            response: function (response) {
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

mmsApp.run(['$location', '$uiRouter', 'RootScopeService', 'AuthService',
    function($location : ILocationService, $uiRouter : UIRouter, rootScopeSvc: RootScopeService, authSvc: AuthService) {

    var $globalState = $uiRouter.globals;
    var $state = $uiRouter.stateService
    // $uiRouter.urlService.rules.when("",() => {
    //     $state.go('main.login');
    // })
    //$uiRouter.urlService.rules.when(new RegExp("^/full%23(.*)$"), matchValue => '/full#' + matchValue[1])
    // $uiRouter.urlService.rules.when(new RegExp(".*"), (match, url: UrlParts | undefined) => {
    //     var locationPath = $location.path();
    //     if (locationPath.indexOf('full%23') > 0)
    //         locationPath = locationPath.replace('full%23', 'full#');
    //     if (locationPath[0] !== '/')
    //         locationPath = '/' + locationPath;
    //     if (locationPath[locationPath.length-1] == '/')
    //         locationPath = locationPath.substring(0, locationPath.length-1);
    //
    //     // if loading 'full' route with an anchor id, switch to views route instead
    //     if ( $globalState.current.name === '' || $globalState.current.name === 'main.login.redirect' ) {
    //         var string = '/full#';
    //         var hash = url.hash;
    //         var index = locationPath.indexOf(string);
    //         if ( index !== -1 && hash && !hash.endsWith('_pei')) {
    //             locationPath = locationPath.substr(0, index) + '/views/' + hash;
    //         }
    //     }
    //     if (locationPath !== $location.path())
    //         $location.url(locationPath);
    // });

    // Check if user is logged in, if so redirect to select page otherwise go to login if the url isn't mapped
    $uiRouter.urlService.rules.otherwise((match, url: UrlParts | undefined) => {
        authSvc.checkLogin().then((checkLogin) =>{
            if (checkLogin) {
                if ($location.url().includes('workspace')) {
                    rootScopeSvc.veRedirectFromOld(true);
                    rootScopeSvc.veCrushUrl($location.path());
                    $state.go('main.login.redirect');
                } else {
                    rootScopeSvc.veRedirectFromOld(false);
                    $state.go('main.login.select');
                }
            } else {
                $state.go('main.login');
            }
        });
    });

    // if ($globalState.current.name == '') {
    //     $state.go('main');
    // }
}]);
