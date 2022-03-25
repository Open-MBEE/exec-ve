import * as angular from 'angular';
import uiRouter, {Transition, StateService} from "@uirouter/angularjs";
import {StateProvider, UIRouter, TransitionService, UrlParts} from "@uirouter/angularjs";
import {
    IHttpProvider, IHttpResponse,
    IHttpService,
    IIntervalService,
    ILocationProvider,
    ILocationService, IPromise, IQService,
    IRequestConfig
} from "angular";
import {RootScopeService} from "../ve-utils/services/RootScopeService.service";
import {AuthService} from "../ve-utils/services/AuthorizationService.service";
import {URLService, URLServiceProvider} from "../ve-utils/services/URLService.provider";
import {ResolveService} from "./services/Resolve.service";
import {ngStorage} from "ngstorage";
import {ProjectService} from "../ve-utils/services/ProjectService.service";
import {HttpService} from "../ve-utils/services/HttpService.service";
import {EventService} from "../ve-utils/services/EventService.service";
import {ApplicationService} from "../ve-utils/services/ApplicationService.service";

var veApp = angular.module('veApp', ['veUtils', 'veDirectives', 'ui.bootstrap', uiRouter, 'ui.tree', 'angular-growl', 'angular-flatpickr', 'rx', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'ngStorage', 'ngAnimate', 'ngPromiseExtras', 'ngCookies']);
//var veApp = angular.module('veApp', ['veUtils', 'veDirectives', 'fa.directive.borderLayout', 'ui.bootstrap', uiRouter.default, 'ui.tree', 'angular-growl', 'cfp.hotkeys', 'angulartics', 'angulartics.piwik', 'ngStorage', 'ngAnimate', 'ngPromiseExtras', 'ngCookies']);

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
            url: '',
            component: 'main',
            redirectTo: 'main.login'
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
                        mmsOrgs: 'orgObs',
                        mmsProject: 'projectOb',
                        mmsRef: 'refOb',
                        mmsRefs: 'refObs',
                        mmsGroups: 'groupObs'
                    },
                },
                'pane-center@main': {
                    component: 'centerView'
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
                    component: 'centerView'
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
                viewOb: ['documentOb', function (documentOb: angular.mms.ViewObject) {
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
                    component: 'centerView'
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
                    component: 'centerView'
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

            deferred.promise.then(function() {
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
            },
            responseError: (rejection) => {
                let timeout = rejection.config.timeout as IPromise<any>;
                if (rejection.status == 401) {
                    console.log(rejection.config.url);
                    if (timeout.state && timeout.state === 'fulfilled') {
                        return $q.when('cancelled');
                    }else {
                        eventSvc.$broadcast('mms.unauthorized');
                        //return $q.when('event-triggered');
                    }
                }

                return rejection
            },
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

veApp.run(['$q', '$http', '$interval', '$location', '$uibModal', '$uiRouter', '$transitions', 'RootScopeService', 'AuthService', 'EventService',
    function($q, $http: IHttpService, $interval: IIntervalService, $location : ILocationService, $uibModal, $uiRouter : UIRouter, $transitions: TransitionService, rootScopeSvc: RootScopeService, authSvc: AuthService,
             eventSvc: EventService) {

    var $globalState = $uiRouter.globals;
    var $state = $uiRouter.stateService
    rootScopeSvc.loginModalOpen(false);
    $transitions.onBefore({}, (transition: Transition) => {
        let deferred = $q.defer();
        console.log(transition.to().name);
        if ($globalState.current.name === 'main.login' || transition.$to().name === 'main.login' || rootScopeSvc.loginModalOpen())
            return;
        authSvc.checkLogin().then(() => {
            deferred.resolve();
        }, () => {
            $http.pendingRequests.forEach(function (pendingReq) {
                if (pendingReq.cancel) {
                    pendingReq.cancel.resolve('Cancel!');
                }
            });
            rootScopeSvc.veRedirect({toState: transition.to(), toParams: transition.params()})
            deferred.resolve($state.target('main.login', {next: transition.to().name}));
        })

        return deferred.promise
    })
    $transitions.onError({},(reason) => {
        console.log(reason);
        //console.log(reason.error());
    })
    eventSvc.$on('mms.unauthorized', async (response) => {
        // add a boolean to the 'or' statement to check for modal window
        if ($globalState.current.name === '' || $globalState.current.name === 'main.login' || rootScopeSvc.veStateChanging() || rootScopeSvc.loginModalOpen())
            return;
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

    // if ($globalState.current.name == '') {
    //     $state.go('main');
    // }
}])
