//const Visualizer = window['ui-router-visualizer'].Visualizer;

import ngPane from '@openmbee/pane-layout'
import uiRouter, {
    StateProvider,
    StateService,
    Transition,
    TransitionService,
    UIRouter,
    UIRouterGlobals,
    UrlParts,
} from '@uirouter/angularjs'
import angular, {
    IHttpInterceptor,
    IHttpResponse,
    IHttpService,
    IIntervalService,
    ILocationProvider,
    ILocationService,
    IPromise,
    IQService,
    IRequestConfig,
} from 'angular'

import { LoginModalResolveFn } from '@ve-app/main/modals/login-modal.component'
import { ResolveService } from '@ve-app/main/services'
import {
    AuthService,
    URLService,
    ProjectService,
    PermissionCache,
    ViewService,
    DocumentMetadata,
} from '@ve-utils/mms-api-client'
import {
    BrandingStyle,
    EventService,
    RootScopeService,
} from '@ve-utils/services'

import { VePromise } from '@ve-types/angular'
import {
    CheckAuthResponse,
    DocumentObject,
    GroupObject,
    GroupsResponse,
    MountObject,
    OrgObject,
    OrgsResponse,
    ParamsObject,
    PermissionsResponse,
    ProjectObject,
    ProjectsResponse,
    RefObject,
    RefsResponse,
    ViewObject,
} from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

export const veApp = angular.module('ve-app', [
    've-utils',
    've-core',
    've-components',
    'ui.bootstrap',
    uiRouter,
    ngPane,
    'ui.tree',
    'angular-growl',
    'angular-flatpickr',
    'cfp.hotkeys',
    'angulartics',
    'angulartics.piwik',
    'ngAnimate',
    'ngCookies',
    'ngPromiseExtras',
    'ngSanitize',
    'ngStorage',
])

veApp.config([
    '$stateProvider',
    '$uiRouterProvider',
    '$transitionsProvider',
    '$httpProvider',
    '$provide',
    '$locationProvider',
    function (
        $stateProvider: StateProvider,
        $uiRouterProvider: UIRouter,
        $transitionsProvider: TransitionService,
        $httpProvider: angular.IHttpProvider,
        $provide: angular.auto.IProvideService,
        $locationProvider: ILocationProvider
    ): void {
        // override uibTypeaheadPopup functionality
        $provide.decorator('uibTypeaheadPopupDirective', [
            '$delegate',
            function (
                $delegate: ({
                    link?(
                        scope: angular.IScope,
                        element: JQLite,
                        attr: angular.IAttributes
                    ): void
                } & angular.IDirective)[]
            ): {
                link?(
                    scope: angular.IScope,
                    element: JQLite,
                    attr: angular.IAttributes
                ): void
            } & angular.IDirective[] {
                const originalLinkFn = $delegate[0].link
                $delegate[0].compile = (): angular.IDirectiveLinkFn => {
                    return function newLinkFn(
                        scope: {
                            selectActive(matchId: string): void
                            active: string
                        } & angular.IScope,
                        elem,
                        attr
                    ) {
                        // fire the originalLinkFn
                        // eslint-disable-next-line prefer-rest-params
                        originalLinkFn.apply($delegate[0], [scope, elem, attr])
                        scope.selectActive = (matchIdx): void => {
                            // added behavior
                            elem.children().removeClass('active')
                            // default behavior
                            scope.active = matchIdx
                        }
                    }
                }
                // get rid of the old link function since we return a link function in compile
                delete $delegate[0].link
                return $delegate
            },
        ])

        $locationProvider.hashPrefix('')

        $httpProvider.defaults.withCredentials = true

        $stateProvider
            .state('main', {
                url: '',
                component: 'main',
            })
            .state('main.login', {
                url: '/login?next',
                params: {
                    next: {
                        type: 'query',
                        squash: true,
                    },
                },
                resolve: {
                    bannerOb: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner()
                        },
                    ],
                    loginBannerOb: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getLoginBanner()
                        },
                    ],
                    paramsOb: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params()
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                    },
                    'login@main': {
                        component: 'login',
                        bindings: {
                            mmsLoginBanner: 'loginBannerOb',
                        },
                    },
                },
            })
            .state('main.login.redirect', {
                url: '/redirect',
                resolve: {
                    token: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken()
                        },
                    ],
                },
                views: {
                    'login@main': {
                        component: 'redirect',
                    },
                },
            })
            .state('main.login.select', {
                url: '/select?fromLogin',
                params: {
                    fromLogin: {
                        type: 'query',
                    },
                },
                resolve: {
                    token: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken()
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner()
                        },
                    ],
                    loginBannerOb: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getLoginBanner()
                        },
                    ],
                    orgObs: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<OrgObject[], OrgsResponse> => {
                            return resolveSvc.getOrgs()
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                    },
                    'login@main': {
                        component: 'projectSelect',
                        bindings: {
                            mmsOrgs: 'orgObs',
                            mmsLoginBanner: 'loginBannerOb',
                        },
                    },
                },
            })
            .state('main.project', {
                //TODO this will be the ui to diff and merge and manage refs
                url: '/projects/:projectId',
                abstract: true,
                params: {
                    projectId: {
                        type: 'path',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params()
                        },
                    ],
                    token: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken()
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner()
                        },
                    ],
                    projectOb: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<ProjectObject, ProjectsResponse> => {
                            return resolveSvc.getProject(params)
                        },
                    ],
                    projectObs: [
                        'ProjectService',
                        'projectOb',
                        (
                            projectSvc: ProjectService,
                            projectOb: ProjectObject
                        ): VePromise<ProjectObject[], ProjectsResponse> => {
                            return projectSvc.getProjects(projectOb.orgId)
                        },
                    ],
                    orgOb: [
                        'ResolveService',
                        'projectOb',
                        (
                            resolveSvc: ResolveService,
                            projectOb: ProjectObject
                        ): VePromise<OrgObject, OrgsResponse> => {
                            return resolveSvc.getOrg(projectOb)
                        },
                    ],
                    orgObs: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<OrgObject[], OrgsResponse> => {
                            return resolveSvc.getOrgs()
                        },
                    ],
                    refObs: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<RefObject[], RefsResponse> => {
                            return resolveSvc.getRefs(params)
                        },
                    ],
                    tagObs: [
                        'ResolveService',
                        'refObs',
                        (
                            resolveSvc: ResolveService,
                            refObs: RefObject[]
                        ): RefObject[] => {
                            return resolveSvc.getTags(refObs)
                        },
                    ],
                    branchObs: [
                        'ResolveService',
                        'refObs',
                        (
                            resolveSvc: ResolveService,
                            refObs: RefObject[]
                        ): RefObject[] => {
                            return resolveSvc.getBranches(refObs)
                        },
                    ],
                    documentOb: () => {
                        return null
                    },
                    viewOb: () => {
                        return null
                    },
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                    },
                    'nav@main': {
                        component: 'navBar',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsOrgs: 'orgObs',
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsRef: 'refOb',
                        },
                    },
                    'menu@main': {
                        component: 'mainMenu',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsGroup: 'groupOb',
                            mmsGroups: 'groupObs',
                            mmsBranch: 'branchOb',
                            mmsBranches: 'branchObs',
                            mmsRef: 'refOb',
                            mmsTag: 'tagOb',
                            mmsTags: 'tagObs',
                            mmsDocument: 'documentOb',
                            mmsView: 'viewOb',
                        },
                    },
                },
            })
            .state('main.project.refs', {
                url: '/refs',
                views: {
                    'pane-center@main': {
                        component: 'refs',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsRefs: 'refObs',
                            mmsTags: 'tagObs',
                            mmsBranches: 'branchObs',
                        },
                    },
                },
            })
            .state('main.project.ref', {
                // equivalent to old sites and documents page
                url: '/:refId',
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params()
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options()
                            return (
                                options.reload === true ||
                                options.reload === 'true'
                            )
                        },
                    ],
                    projectOb: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<MountObject, ProjectsResponse> => {
                            return resolveSvc.getProjectMounts(params)
                        },
                    ],
                    refOb: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<RefObject, RefsResponse> => {
                            return resolveSvc.getRef(params)
                        },
                    ],
                    tagOb: [
                        'refOb',
                        'ResolveService',
                        (
                            refOb: RefObject,
                            resolveSvc: ResolveService
                        ): RefObject => {
                            return resolveSvc.getTag(refOb)
                        },
                    ],
                    branchOb: [
                        'refOb',
                        'ResolveService',
                        (
                            refOb: RefObject,
                            resolveSvc: ResolveService
                        ): RefObject => {
                            return resolveSvc.getBranch(refOb)
                        },
                    ],
                    groupOb: () => {
                        return null
                    },
                    groupObs: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refresh: boolean
                        ): VePromise<GroupObject[], GroupsResponse> => {
                            return resolveSvc.getGroups(params, refresh)
                        },
                    ],
                    documentOb: [
                        'params',
                        'refresh',
                        'refOb',
                        'projectOb',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            refresh: boolean,
                            refOb: RefObject,
                            projectOb: ProjectObject,
                            resolveSvc: ResolveService
                        ): VePromise<DocumentObject> => {
                            return resolveSvc.getDocument(
                                params,
                                refOb,
                                projectOb,
                                refresh
                            )
                        },
                    ],
                    viewOb: [
                        'documentOb',
                        (documentOb: DocumentObject): ViewObject => {
                            return documentOb
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner()
                        },
                    ],
                    footerOb: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getFooter()
                        },
                    ],
                    docMeta: () => {
                        return {}
                    },
                    permissions: [
                        'refOb',
                        'projectOb',
                        'ResolveService',
                        (
                            refOb: RefObject,
                            projectOb: ProjectObject,
                            resolveSvc: ResolveService
                        ): VePromise<PermissionCache, PermissionsResponse> => {
                            return resolveSvc.initializePermissions(
                                projectOb,
                                refOb
                            )
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                    },
                    'nav@main': {
                        component: 'navBar',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsOrgs: 'orgObs',
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsRef: 'refOb',
                        },
                    },
                    'menu@main': {
                        component: 'mainMenu',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsGroup: 'groupOb',
                            mmsGroups: 'groupObs',
                            mmsBranch: 'branchOb',
                            mmsBranches: 'branchObs',
                            mmsRef: 'refOb',
                            mmsTag: 'tagOb',
                            mmsTags: 'tagObs',
                            mmsDocument: 'documentOb',
                            mmsView: 'viewOb',
                        },
                    },
                    'pane-left@main': {
                        component: 'leftPane',
                        bindings: {
                            mmsDocument: 'documentOb',
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsGroups: 'groupObs',
                            docMeta: 'docMeta',
                        },
                    },

                    'pane-center@main': {
                        component: 'slideshow',
                    },
                    'pane-right@main': {
                        component: 'rightPane',
                    },
                    'toolbar-right@main': {
                        component: 'rightToolbar',
                    },
                    'banner-bottom@main': {
                        component: 'systemFooter',
                    },
                },
            })
            .state('main.project.ref.portal', {
                url: '/portal',
                views: {
                    'pane-center@main': {
                        component: 'slideshow',
                    },
                },
            })
            .state('main.project.ref.groupReorder', {
                url: '/group-reorder',
                resolve: {
                    documentObs: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<DocumentObject[]> => {
                            return resolveSvc.getProjectDocuments(params)
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'reorderGroup',
                    },
                },
            })
            .state('main.project.ref.manage', {
                //not needed right now, for managing mounts
                url: '/manage',
            })
            .state('main.project.ref.preview', {
                url: '/document/:documentId',
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params()
                        },
                    ],
                    documentOb: [
                        'ResolveService',
                        'params',
                        'refOb',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refOb: RefObject,
                            refresh: boolean
                        ): VePromise<DocumentObject> => {
                            return resolveSvc.getDocumentPreview(
                                params,
                                refOb,
                                refresh
                            )
                        },
                    ],
                    viewOb: [
                        'documentOb',
                        (documentOb: DocumentObject): ViewObject => {
                            return documentOb
                        },
                    ],
                    groupOb: [
                        'groupObs',
                        'documentOb',
                        'ResolveService',
                        (
                            groupObs: GroupObject[],
                            documentOb: DocumentObject,
                            resolveSvc: ResolveService
                        ): GroupObject => {
                            return resolveSvc.getGroup(groupObs, documentOb)
                        },
                    ],
                },
                views: {
                    'menu@main': {
                        component: 'mainMenu',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsGroup: 'groupOb',
                            mmsGroups: 'groupObs',
                            mmsBranch: 'branchOb',
                            mmsBranches: 'branchObs',
                            mmsRef: 'refOb',
                            mmsTag: 'tagOb',
                            mmsTags: 'tagObs',
                            mmsDocument: 'documentOb',
                            mmsView: 'viewOb',
                        },
                    },
                    'pane-center@main': {
                        component: 'slideshow',
                    },
                },
            })
            .state('main.project.ref.document', {
                url: '/documents/:documentId',
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params()
                        },
                    ],
                    documentOb: [
                        'params',
                        'refresh',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            refresh: boolean,
                            resolveSvc: ResolveService
                        ): VePromise<DocumentObject> => {
                            return resolveSvc.getProjectDocument(
                                params,
                                refresh
                            )
                        },
                    ],
                    viewOb: [
                        'documentOb',
                        (documentOb: DocumentObject): ViewObject => {
                            return documentOb
                        },
                    ],
                    groupOb: [
                        'groupObs',
                        'documentOb',
                        'ResolveService',
                        (
                            groupObs: GroupObject[],
                            documentOb: DocumentObject,
                            resolveSvc: ResolveService
                        ): GroupObject => {
                            return resolveSvc.getGroup(groupObs, documentOb)
                        },
                    ],
                    docMeta: [
                        'ViewService',
                        'documentOb',
                        (
                            viewSvc: ViewService,
                            documentOb: DocumentObject
                        ): VePromise<DocumentMetadata> => {
                            return viewSvc.getDocumentMetadata({
                                projectId: documentOb._projectId,
                                refId: documentOb._refId,
                                elementId: documentOb.id,
                            })
                        },
                    ],
                },
                views: {
                    'menu@main': {
                        component: 'mainMenu',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsGroup: 'groupOb',
                            mmsGroups: 'groupObs',
                            mmsBranch: 'branchOb',
                            mmsBranches: 'branchObs',
                            mmsRef: 'refOb',
                            mmsTag: 'tagOb',
                            mmsTags: 'tagObs',
                            mmsDocument: 'documentOb',
                            mmsView: 'viewOb',
                        },
                    },
                    'pane-left@main': {
                        component: 'leftPane',
                        bindings: {
                            mmsDocument: 'documentOb',
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsGroups: 'groupObs',
                            docMeta: 'docMeta',
                        },
                    },
                    'pane-center@main': {
                        component: 'slideshow',
                    },
                    'pane-right@main': {
                        component: 'rightPane',
                    },
                    'toolbar-right@main': {
                        component: 'rightToolbar',
                    },
                },
            })
            .state('main.project.ref.document.view', {
                url: '/views/:viewId',
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params()
                        },
                    ],
                    viewOb: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refresh: boolean
                        ): VePromise<ViewObject> => {
                            return resolveSvc.getView(params, refresh)
                        },
                    ],
                    groupOb: [
                        'groupObs',
                        'documentOb',
                        'ResolveService',
                        (
                            groupObs: GroupObject[],
                            documentOb: DocumentObject,
                            resolveSvc: ResolveService
                        ): GroupObject => {
                            return resolveSvc.getGroup(groupObs, documentOb)
                        },
                    ],
                },
                views: {
                    'menu@main': {
                        component: 'mainMenu',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsGroup: 'groupOb',
                            mmsGroups: 'groupObs',
                            mmsBranch: 'branchOb',
                            mmsBranches: 'branchObs',
                            mmsRef: 'refOb',
                            mmsTag: 'tagOb',
                            mmsTags: 'tagObs',
                            mmsDocument: 'documentOb',
                            mmsView: 'viewOb',
                        },
                    },
                    'pane-center@main': {
                        component: 'slideshow',
                    },
                },
            })
            .state('main.project.ref.document.order', {
                url: '/order',
                resolve: {
                    documentOb: [
                        'params',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            resolveSvc: ResolveService
                        ): VePromise<DocumentObject> => {
                            return resolveSvc.getProjectDocument(params, true)
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'reorderDocument',
                    },
                },
            })
            .state('main.project.ref.document.full', {
                url: '/full',
                views: {
                    'pane-center@main': {
                        component: 'document',
                    },
                },
            })
            .state('main.project.ref.search', {
                url: '/search?search&field',
                params: {
                    search: {
                        dynamic: true,
                    },
                    field: {
                        dynamic: true,
                    },
                },
                resolve: {
                    field: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): string => {
                            return resolveSvc.getField(params)
                        },
                    ],
                    search: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): string => {
                            return resolveSvc.getSearch(params)
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'search',
                    },
                },
            })
            .state('main.share', {
                url: '/s/:shortUrl',
                resolve: {
                    token: [
                        'ResolveService',
                        (
                            resolveSvc: ResolveService
                        ): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken()
                        },
                    ],
                    paramsOb: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params()
                        },
                    ],
                },
                views: {
                    'login@main': {
                        component: 'shortUrl',
                    },
                },
            })

        // anonymous factory intercepts requests
        $httpProvider.interceptors.push([
            '$q',
            '$location',
            'URLService',
            'EventService',
            function (
                $q: IQService,
                $location: ILocationService,
                uRLSvc: URLService,
                eventSvc: EventService
            ): IHttpInterceptor {
                return {
                    request: (config: IRequestConfig): IRequestConfig => {
                        config.headers = uRLSvc.getAuthorizationHeader(
                            config.headers
                        )
                        if (!config.timeout) {
                            config.cancel = $q.defer()
                            config.timeout = config.cancel.promise
                        } else {
                            console.log(config.url)
                        }
                        return config
                    },
                    responseError: (
                        rejection: IHttpResponse<any>
                    ): IPromise<IHttpResponse<any>> | IHttpResponse<any> => {
                        const timeout: IPromise<string> = rejection.config
                            .timeout as IPromise<string>
                        if (timeout.state && timeout.state === 'cancelled') {
                            rejection.data = 'cancelled'
                            return $q.when(rejection)
                        }
                        if (rejection.status == 401) {
                            console.log(rejection.config.url)
                            if (
                                rejection.config.url ===
                                uRLSvc.getCheckTokenURL()
                            ) {
                                return $q.reject(rejection)
                            } else {
                                eventSvc.$broadcast('mms.unauthorized')
                            }
                        }
                        return $q.reject(rejection)
                    },
                    response: (response): IHttpResponse<any> => {
                        if (response.status === 202) {
                            eventSvc.$broadcast('mms.working', response)
                        }
                        response.status = 501
                        return response
                    },
                }
            },
        ])

        $httpProvider.useApplyAsync(true)

        // $uiRouterProvider.urlService.rules.otherwise((match, url: UrlParts | undefined) => {
        //     console.log(url);
        // })
    },
])

veApp.run([
    '$q',
    '$http',
    '$interval',
    '$location',
    '$uibModal',
    '$uiRouter',
    '$uiRouterGlobals',
    '$state',
    '$transitions',
    'RootScopeService',
    'AuthService',
    'EventService',
    function (
        $q: IQService,
        $http: IHttpService,
        $interval: IIntervalService,
        $location: ILocationService,
        $uibModal: VeModalService,
        $uiRouter: UIRouter,
        $uiRouterGlobals: UIRouterGlobals,
        $state: StateService,
        $transitions: TransitionService,
        rootScopeSvc: RootScopeService,
        authSvc: AuthService,
        eventSvc: EventService
    ): void {
        rootScopeSvc.loginModalOpen(false)
        $transitions.onBefore({}, (transition: Transition) => {
            if (
                $uiRouterGlobals.current.name === 'main.login' ||
                transition.$to().name === 'main.login' ||
                rootScopeSvc.loginModalOpen()
            ) {
                return
            }
            return new Promise((resolve) => {
                authSvc.checkLogin().then(
                    () => {
                        if (transition.$to().name === 'main') {
                            resolve($state.target('main.login.select'))
                        }
                        if (transition.$to().name === 'main.project.ref') {
                            resolve($state.target('main.project.ref.portal'))
                        }
                        resolve()
                    },
                    () => {
                        $http.pendingRequests.forEach((pendingReq) => {
                            if (pendingReq.cancel) {
                                pendingReq.cancel.resolve('cancelled')
                            }
                        })
                        if (transition.$to().name !== 'main') {
                            rootScopeSvc.veRedirect({
                                toState: transition.to(),
                                toParams: transition.params(),
                            })
                            resolve(
                                $state.target('main.login', {
                                    next: transition.to().url,
                                })
                            )
                        } else {
                            resolve($state.target('main.login'))
                        }
                    }
                )
            })
        })
        $transitions.onError({}, (reason) => {
            console.log(reason)
            //console.log(reason.error());
        })
        eventSvc.$on('mms.unauthorized', (response) => {
            // add a boolean to the 'or' statement to check for modal window
            if (
                $uiRouterGlobals.current.name === '' ||
                $uiRouterGlobals.current.name === 'main.login' ||
                rootScopeSvc.veStateChanging() ||
                rootScopeSvc.loginModalOpen()
            ) {
                if (
                    $uiRouterGlobals.current.name === 'main.login.select' ||
                    ($uiRouterGlobals.transition &&
                        $uiRouterGlobals.transition.$to.name ===
                            'main.login.select')
                ) {
                    void $state.go('main.login')
                }
                return
            }

            authSvc.checkLogin().then(
                () => {
                    /* do nothing if success */
                },
                () => {
                    rootScopeSvc.loginModalOpen(true)
                    $uibModal
                        .open<LoginModalResolveFn, boolean>({
                            component: 'loginModal',
                            resolve: {
                                continue: () => {
                                    return true
                                },
                            },
                            backdrop: 'static',
                            size: 'md',
                        })
                        .result.finally(() => {
                            rootScopeSvc.loginModalOpen(false)
                        })
                }
            )
        })

        // broadcast mms.unauthorized every 10 minutes with interval service
        void $interval(
            () => {
                eventSvc.$broadcast('mms.unauthorized')
            },
            window.__env.loginTimeout ? window.__env.loginTimeout : 60000,
            0,
            false
        )

        // Check if user is logged in, if so redirect to select page otherwise go to login if the url isn't mapped
        $uiRouter.urlService.rules.otherwise(
            (match, url: UrlParts | undefined) => {
                void authSvc.checkLogin().then((checkLogin) => {
                    if (checkLogin) {
                        if ($location.url().includes('workspace')) {
                            rootScopeSvc.veRedirectFromOld(true)
                            rootScopeSvc.veCrushUrl($location.path())
                            void $state.go('main.login.redirect')
                        } else {
                            rootScopeSvc.veRedirectFromOld(false)
                            void $state.go('main.login.select')
                        }
                    } else {
                        void $state.go('main.login')
                    }
                })
            }
        )
    },
])

// veApp.run([
//     '$uiRouter',
//     '$trace',
//     ($uiRouter, $trace) => {
//         //var pluginInstance = $uiRouter.plugin(Visualizer);
//         $trace.enable('TRANSITION')
//     },
// ])
