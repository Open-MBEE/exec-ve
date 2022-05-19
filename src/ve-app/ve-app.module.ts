//const Visualizer = window['ui-router-visualizer'].Visualizer;

import * as angular from 'angular';
import {
    IHttpResponse,
    IHttpService,
    IIntervalService,
    ILocationProvider,
    ILocationService,
    IPromise,
    IQService,
    IRequestConfig
} from 'angular';
import uiRouter, {
    StateProvider,
    StateService,
    Transition,
    TransitionService,
    UIRouter,
    UIRouterGlobals,
    UrlParts
} from "@uirouter/angularjs";
import {
    AuthService,
    EventService,
    ProjectService,
    RootScopeService,
    URLService,
    URLServiceProvider
} from "@ve-utils/services";
import {ResolveService} from "./services/Resolve.service";
import {ViewObject} from "@ve-types/mms";
import ngPane from 'angular-pane-layout';

export let veApp = angular.module('ve-app', ['ve-utils', 've-core', 've-ext', 'ui.bootstrap', uiRouter, ngPane, 'ui.tree', 'angular-growl', 'angular-flatpickr', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'ngAnimate', 'ngCookies', 'ngPromiseExtras', 'ngSanitize', 'ngStorage']);

veApp.config(['$stateProvider', '$uiRouterProvider', '$transitionsProvider', '$httpProvider', '$provide', 'URLServiceProvider', '$locationProvider', function($stateProvider: StateProvider, $uiRouterProvider : UIRouter, $transitionsProvider: TransitionService, $httpProvider : angular.IHttpProvider, $provide : angular.auto.IProvideService, $urlServiceProvider: URLServiceProvider, $locationProvider : ILocationProvider) {
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


    if (window.__env.basePath) {
        $urlServiceProvider.setBasePath(window.__env.basePath);
    } else {
        $urlServiceProvider.setBasePath('');
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
            url: '',
            component: 'main'
        })
        .state('main.login', {
            url: '/login?next',
            params: {
                next: {
                    type: 'query',
                    squash: true
                }
            },
            resolve: {
                bannerOb: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getBanner();
                }],
                loginBannerOb: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getLoginBanner();
                }],
                paramsOb: ['$transition$', function($transition$) {
                    return $transition$.params();
                }]
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
                token: ['ResolveService', function(resolveSvc: ResolveService) {
                    return resolveSvc.getToken();
                }],
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
            url: '/projects/:projectId',
            params: {
                projectId: {
                    type: 'path'
                }
            }
        })
        .state('main.project.ref', { // equivalent to old sites and documents page
            url: '/:refId?search',
            resolve: {
                params: ['$transition$', function ($transition$): {[paramName: string]: any } {
                    return $transition$.params();
                }],
                projectOb: ['ResolveService', 'params', (resolveSvc: ResolveService, params: {[paramName: string]: any }) => {
                    return resolveSvc.getProjectMounts(params);
                }],
                orgOb: ['ResolveService', 'projectOb', function (resolveSvc: ResolveService, projectOb) {
                    return resolveSvc.getOrg(projectOb);
                }],
                orgObs: ['ResolveService', function (resolveSvc: ResolveService) {
                    return resolveSvc.getOrgs();
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
                    return resolveSvc.getGroups($transition$)
                }],
                documentOb: ['$transition$', 'refOb', 'projectOb', 'ResolveService', ($transition$, refOb, projectOb, resolveSvc) => {
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
                        mmsOrg: 'orgOb',
                        mmsOrgs: 'orgObs',
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
                        mmsGroups: 'groupObs',
                        docMeta: 'docMeta'
                    },
                },
                'pane-center@main': {
                    component: 'singleView'
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
                    templateUrl: 'partials/ve-utils/reorder-groups.html',
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
                params: ['$transition$', function ($transition$): {[paramName: string]: any } {
                    return $transition$.params();
                }],
                projectOb: ['ResolveService', 'params', (resolveSvc: ResolveService, params: {[paramName: string]: any }) => {
                    return resolveSvc.getProjectMounts(params);
                }],
                documentOb: ['ResolveService', 'params', 'refOb', (resolveSvc: ResolveService, params: {[paramName: string]: any }, refOb) => {
                    return resolveSvc.getDocumentPreview(params, refOb)
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
                    component: 'singleView'
                },
                'pane-right@main': {
                    component: 'rightPane'
                }
            }
        })
        .state('main.project.ref.document', {
            url: '/documents/:documentId',
            resolve: {
                params: ['$transition$', function ($transition$): {[paramName: string]: any } {
                    return $transition$.params();
                }],
                documentOb: ['params', 'ResolveService', function (params: {[paramName: string]: any }, resolveSvc: ResolveService) {
                    return resolveSvc.getProjectDocument(params);
                }],
                viewOb: ['documentOb', function (documentOb: ViewObject) {
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
                        mmsGroups: 'groupObs',
                        docMeta: 'docMeta'
                    },
                },
                'pane-center@main': {
                    component: 'singleView'
                },
                'pane-right@main': {
                    component: 'rightPane'
                },
                'toolbar-right@main': {
                    component: 'toolbar'
                }
            }
        })
        .state('main.project.ref.document.view', {
            url: '/views/:viewId',
            resolve: {
                params: ['$transition$', function ($transition$): {[paramName: string]: any } {
                    return $transition$.params();
                }],
                viewOb: ['ResolveService', '$transition$', (resolveSvc: ResolveService, $transition$) => {
                    let params = $transition$.params();
                    return resolveSvc.getView(params).then((response) => {
                        let viewOb = response;
                        return viewOb;
                    });
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
                    component: 'singleView'
                },
            }
        })
        .state('main.project.ref.document.order', {
            url: '/order',
            views: {
                'pane-center@main': {
                    templateUrl: 'partials/ve-utils/reorder-views.html',
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

    $provide.decorator('$q', ['$delegate', function ($delegate) {
        var defer = $delegate.defer;
        $delegate.defer = function() {
            var deferred = defer();

            deferred.promise.state = deferred.state = 'pending';

            deferred.promise.then(function(result) {
                if (result === 'cancelled') {
                    deferred.promise.state = 'cancelled';
                }
                deferred.promise.state = deferred.state = 'fulfilled';
            }, function () {
                deferred.promise.state = deferred.state = 'rejected';
            });

            return deferred;
        };
        return $delegate;
    }]);

    // anonymous factory intercepts requests
    $httpProvider.interceptors.push(['$q', '$location', 'URLService', 'EventService', function ($q: IQService, $location: ILocationService, uRLSvc: URLService, eventSvc: EventService) {
        return {
            request: (config: IRequestConfig) => {
                config.headers = uRLSvc.getAuthorizationHeader(config.headers);
                if(!config.timeout) {
                    config.cancel = $q.defer();
                    config.timeout = config.cancel.promise
                }else {
                    console.log(config.url)
                }
                return config
            }
        }
    }]);

    $httpProvider.interceptors.push(['$q', '$location', 'URLService', 'EventService', function ($q: IQService, $location: ILocationService, uRLSvc: URLService, eventSvc: EventService) {
        return {
            responseError: (rejection: IHttpResponse<any>): angular.IPromise<angular.IHttpResponse<any>> | IHttpResponse<any> => {
                let timeout: angular.IPromise<string> = rejection.config.timeout as IPromise<any>;
                if (timeout.state && timeout.state === 'cancelled') {
                    rejection.data = 'cancelled';
                    return $q.when(rejection);
                }
                if (rejection.status == 401) {
                    console.log(rejection.config.url);
                    if (rejection.config.url === uRLSvc.getCheckTokenURL()) {
                        return $q.reject(rejection);
                    } else {
                        eventSvc.$broadcast('mms.unauthorized');
                    }
                }
                return $q.reject(rejection);
            }
        }
    }]);

    $httpProvider.interceptors.push(['$q', '$location', 'URLService', 'EventService', function ($q: IQService, $location: ILocationService, uRLSvc: URLService, eventSvc: EventService) {
        return {
            response: function (response) {
                if (response.status === 202) {
                    eventSvc.$broadcast("mms.working", response);
                }
                response.status = 501;
                return response;
            }
        }
    }]);

    $httpProvider.useApplyAsync(true);

    // $uiRouterProvider.urlService.rules.otherwise((match, url: UrlParts | undefined) => {
    //     console.log(url);
    // })

}]);

veApp.run(['$q', '$http', '$interval', '$location', '$uibModal', '$uiRouter', '$uiRouterGlobals', '$state', '$transitions', 'RootScopeService', 'AuthService', 'EventService',
    function($q, $http: IHttpService, $interval: IIntervalService, $location : ILocationService, $uibModal, $uiRouter: UIRouter, $uiRouterGlobals : UIRouterGlobals, $state: StateService, $transitions: TransitionService, rootScopeSvc: RootScopeService, authSvc: AuthService,
             eventSvc: EventService) {

    rootScopeSvc.loginModalOpen(false);
    $transitions.onBefore({}, (transition: Transition) => {
        if ($uiRouterGlobals.current.name === 'main.login' || transition.$to().name === 'main.login' || rootScopeSvc.loginModalOpen())
            return;
        let deferred = $q.defer();
        authSvc.checkLogin().then((result) => {
            if (transition.$to().name === 'main') {
                deferred.resolve($state.target('main.login.select'));
            }
            deferred.resolve();
        }, () => {
            $http.pendingRequests.forEach(function (pendingReq) {
                if (pendingReq.cancel) {
                    pendingReq.cancel.resolve('cancelled');
                }
            });
            if (transition.$to().name !== 'main') {
                rootScopeSvc.veRedirect({toState: transition.to(), toParams: transition.params()})
                deferred.resolve($state.target('main.login', {next: transition.to().name}));
            }else {
                deferred.resolve($state.target('main.login'));
            }
        })

        return deferred.promise
    })
    $transitions.onError({},(reason) => {
        console.log(reason);
        //console.log(reason.error());
    })
    eventSvc.$on('mms.unauthorized', (response) => {
        // add a boolean to the 'or' statement to check for modal window
        if ($uiRouterGlobals.current.name === '' || $uiRouterGlobals.current.name === 'main.login' || rootScopeSvc.veStateChanging() || rootScopeSvc.loginModalOpen()) {
            if ($uiRouterGlobals.current.name === 'main.login.select' || ($uiRouterGlobals.transition && $uiRouterGlobals.transition.$to.name === 'main.login.select')) {
                $state.target('main.login');
            }
            return;
        }


        authSvc.checkLogin().then(() => {},() => {
            rootScopeSvc.loginModalOpen(true)
            $uibModal.open({
                component: 'loginModal',
                backdrop: 'static',
                size: 'md'
            }).result.finally(() => {
                rootScopeSvc.loginModalOpen(false)
            });
        });
    });

    // broadcast mms.unauthorized every 10 minutes with interval service
    $interval(() => {
        eventSvc.$broadcast('mms.unauthorized');
    }, (window.__env.loginTimeout) ? window.__env.loginTimeout : 60000, 0, false);


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

}])

veApp.run(['$uiRouter', '$trace', function($uiRouter, $trace) {
   //var pluginInstance = $uiRouter.plugin(Visualizer);
   $trace.enable('TRANSITION');
}])