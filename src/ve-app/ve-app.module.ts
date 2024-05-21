// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access

import ngPane from '@openmbee/pane-layout';
import uiRouter, {
    StateProvider,
    StateService,
    Transition,
    TransitionService,
    UIRouter,
    UIRouterGlobals,
    UrlParts,
    UrlService,
} from '@uirouter/angularjs';
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
} from 'angular';

import { LoginModalResolveFn } from '@ve-app/main/modals/login-modal.component';
import { ResolveService } from '@ve-core/services';
import { ApplicationService, BrandingStyle, RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { AuthService, URLService, PermissionCache, ViewService, DocumentMetadata } from '@ve-utils/mms-api-client';

import { VePromise } from '@ve-types/angular';
import {
    AdminObject,
    CheckAuthResponse,
    DocumentObject,
    GenericResponse,
    MountObject,
    OrgObject,
    OrgsResponse,
    PackageObject,
    ParamsObject,
    PermissionResponse,
    ProjectObject,
    ProjectGroupObject,
    ProjectsResponse,
    RefObject,
    RefsResponse,
    UserGroupsResponse,
    UserObject,
    UsersResponse,
    ViewObject,
    ProjectGroupsResponse,
    GroupObject,
    GroupsResponse,
    GroupUsersResponse,
} from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

export const veApp = angular.module('ve-app', [
    've-utils',
    've-core',
    've-components',
    've-admin',
    've-viewer',
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
]);

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
                    link?(scope: angular.IScope, element: JQLite, attr: angular.IAttributes): void;
                } & angular.IDirective)[]
            ): {
                link?(scope: angular.IScope, element: JQLite, attr: angular.IAttributes): void;
            } & angular.IDirective[] {
                const originalLinkFn = $delegate[0].link;
                $delegate[0].compile = (): angular.IDirectiveLinkFn => {
                    return function newLinkFn(
                        scope: {
                            selectActive(matchId: string): void;
                            active: string;
                        } & angular.IScope,
                        elem,
                        attr
                    ) {
                        // fire the originalLinkFn
                        // eslint-disable-next-line prefer-rest-params
                        originalLinkFn.apply($delegate[0], [scope, elem, attr]);
                        scope.selectActive = (matchIdx): void => {
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
            },
        ]);

        $locationProvider.hashPrefix('');

        $httpProvider.defaults.withCredentials = true;

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
                        raw: true,
                    },
                },
                resolve: {
                    bannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner();
                        },
                    ],
                    loginBannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getLoginBanner();
                        },
                    ],
                    paramsOb: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                        bindings: {
                            mmsBanner: 'bannerOb',
                        },
                    },
                    'login@main': {
                        component: 'login',
                        bindings: {
                            mmsLoginBanner: 'loginBannerOb',
                            mmsParams: 'paramsOb',
                        },
                    },
                },
            })
            .state('main.login.redirect', {
                url: '/redirect',

                resolve: {
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
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
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner();
                        },
                    ],
                    loginBannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getLoginBanner();
                        },
                    ],
                    currentUserOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<UserObject, UsersResponse> => {
                            return resolveSvc.getCurrentUser();
                        },
                    ],
                    orgObs: [
                        'refresh',
                        'ResolveService',
                        (refresh: boolean, resolveSvc: ResolveService): VePromise<OrgObject[], OrgsResponse> => {
                            return resolveSvc.getOrgs(refresh);
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                        bindings: {
                            mmsBanner: 'bannerOb',
                        },
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
            .state('main.home', {
                url: '/home',
                views: {
                    'nav@main': {
                        component: 'navBar',
                    },
                    'menu@main': {
                        component: 'contextBar',
                    },
                    'pane-left@main': {
                        component: 'orgTree',
                    },
                    'pane-center@main': {
                        component: 'orgHome',
                    },
                },
            })
            .state('main.admin', {
                url: '/admin',
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner();
                        },
                    ],
                    footerOb: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getFooter(params);
                        },
                    ],
                    projectObs: [
                        'refresh',
                        'ResolveService',
                        (
                            refresh: boolean,
                            resolveSvc: ResolveService
                        ): VePromise<ProjectObject[], ProjectsResponse> => {
                            return resolveSvc.getProjects(null, refresh);
                        },
                    ],
                    orgObs: [
                        'refresh',
                        'ResolveService',
                        (refresh: boolean, resolveSvc: ResolveService): VePromise<OrgObject[], OrgsResponse> => {
                            return resolveSvc.getOrgs(refresh);
                        },
                    ],
                    currentUserOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<UserObject, UsersResponse> => {
                            return resolveSvc.getCurrentUser();
                        },
                    ],
                    rootOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<AdminObject> => {
                            return resolveSvc.getServerRoot();
                        },
                    ],
                    noOp: [(): boolean => true],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                        bindings: {
                            mmsBanner: 'bannerOb',
                        },
                    },
                    'nav@main': {
                        component: 'navBar',
                        bindings: {
                            mmsOrgs: 'orgObs',
                        },
                    },
                    'menu@main': {
                        component: 'contextBar',
                        bindings: {
                            mmsOrgs: 'orgObs',
                        },
                    },
                    'banner-bottom@main': {
                        component: 'systemFooter',
                        bindings: {
                            mmsFooter: 'footerOb',
                        },
                    },
                    'toolbar-left@main': {
                        component: 'leftToolbar',
                        bindings: {
                            disabled: 'noOp',
                        },
                    },
                    'toolbar-right@main': {
                        component: 'rightToolbar',
                        bindings: {
                            disabled: 'noOp',
                        },
                    },
                    'pane-center@main': {
                        component: 'adminHome',
                        bindings: {
                            mmsOrgs: 'orgObs',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.user', {
                url: '/users',
                resolve: {
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    userObs: [
                        'refresh',
                        'ResolveService',
                        (refresh: boolean, resolveSvc: ResolveService): VePromise<UserObject[], UsersResponse> => {
                            return resolveSvc.getUsers(refresh);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'userList',
                        bindings: {
                            mmsUsers: 'userObs',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.user.profile', {
                url: '/:username',
                params: {
                    username: {
                        type: 'path',
                        inherit: true,
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    userOb: [
                        'params',
                        'refresh',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            refresh: boolean,
                            resolveSvc: ResolveService
                        ): VePromise<UserObject, UsersResponse> => {
                            return resolveSvc.getUser(params.username, refresh);
                        },
                    ],
                    userGroupObs: [
                        'params',
                        'refresh',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            refresh: boolean,
                            resolveSvc: ResolveService
                        ): VePromise<GroupObject[], UserGroupsResponse> => {
                            return resolveSvc.getUserGroups(params.username, refresh);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'profile',
                        bindings: {
                            mmsUser: 'userOb',
                            mmsGroups: 'userGroupObs',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.group', {
                url: '/groups',
                resolve: {
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    groupObs: [
                        'refresh',
                        'ResolveService',
                        (refresh: boolean, resolveSvc: ResolveService): VePromise<UserObject[], UsersResponse> => {
                            return resolveSvc.getUsers(refresh);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'groupList',
                        bindings: {
                            mmsUsers: 'groupObs',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.group.profile', {
                url: '/:groupname',
                params: {
                    groupname: {
                        type: 'path',
                        inherit: true,
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    groupOb: [
                        'params',
                        'refresh',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            refresh: boolean,
                            resolveSvc: ResolveService
                        ): VePromise<GroupObject, GroupsResponse> => {
                            return resolveSvc.getGroup(params.groupname, refresh);
                        },
                    ],
                    groupUsersObs: [
                        'params',
                        'refresh',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            refresh: boolean,
                            resolveSvc: ResolveService
                        ): VePromise<UserObject[], GroupUsersResponse> => {
                            return resolveSvc.getGroupUsers(params.groupname, refresh);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'profile',
                        bindings: {
                            mmsGroup: 'groupOb',
                            mmsUsers: 'groupUsersObs',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.org', {
                url: '/orgs',
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'adminHome',
                        bindings: {
                            mmsOrgs: 'orgObs',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.org.home', {
                url: '/:orgId',
                params: {
                    orgId: {
                        inherit: true,
                        type: 'path',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner();
                        },
                    ],
                    orgOb: [
                        'refresh',
                        'params',
                        'ResolveService',
                        (
                            refresh: boolean,
                            params: ParamsObject,
                            resolveSvc: ResolveService
                        ): VePromise<OrgObject, OrgsResponse> => {
                            return resolveSvc.getOrg(params.orgId, refresh);
                        },
                    ],
                },
                views: {
                    'nav@main': {
                        component: 'navBar',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                        },
                    },
                    'menu@main': {
                        component: 'contextBar',
                        bindings: {
                            mmsOrgs: 'orgObs',
                            mmsOrg: 'orgOb',
                        },
                    },
                    'toolbar-left@main': {
                        component: 'leftToolbar',
                        bindings: {
                            disabled: 'noOp',
                        },
                    },
                    'toolbar-right@main': {
                        component: 'organizationSidebar',
                        bindings: {
                            mmsOrg: 'orgOb',
                            currentUser: 'currentUserOb',
                        },
                    },
                    'pane-center@main': {
                        component: 'informationPage',
                        bindings: {
                            mmsOrg: 'orgOb',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.org.users', {
                url: '/users',
                views: {
                    'pane-center@main': {
                        component: 'membersPage',
                        bindings: {
                            mmsOrg: 'orgOb',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.project', {
                url: '/projects/:projectId',
                params: {
                    projectId: {
                        inherit: true,
                        type: 'path',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner();
                        },
                    ],
                    projectOb: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refresh: boolean
                        ): VePromise<ProjectObject, ProjectsResponse> => {
                            return resolveSvc.getProject(params, refresh);
                        },
                    ],
                    orgOb: [
                        'ResolveService',
                        'projectOb',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            projectOb: ProjectObject,
                            refresh: boolean
                        ): VePromise<OrgObject, OrgsResponse> => {
                            return resolveSvc.getProjectOrg(projectOb, refresh);
                        },
                    ],
                },
                views: {
                    'nav@main': {
                        component: 'navBar',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                        },
                    },
                    'menu@main': {
                        component: 'contextBar',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                        },
                    },
                    'toolbar-left@main': {
                        component: 'leftToolbar',
                        bindings: {
                            disabled: 'noOp',
                        },
                    },
                    'toolbar-right@main': {
                        component: 'projectSidebar',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            currentUser: 'currentUserOb',
                        },
                    },
                    'pane-center@main': {
                        component: 'informationPage',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                        },
                    },
                },
            })
            .state('main.admin.project.users', {
                url: '/users',
                views: {
                    'pane-center@main': {
                        component: 'membersPage',
                        bindings: {
                            mmsProject: 'projectOb',
                            currentUser: 'currentUserOb',
                        },
                    },
                },
            })
            .state('main.admin.project.ref', {
                url: '/:refId',
                params: {
                    refId: {
                        inherit: true,
                        type: 'path',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    refOb: [
                        'ResolveService',
                        'params',
                        (resolveSvc: ResolveService, params: ParamsObject): VePromise<RefObject, RefsResponse> => {
                            return resolveSvc.getRef(params);
                        },
                    ],
                    permissions: [
                        'projectOb',
                        'currentUserOb',
                        (projectOb: ProjectObject, currentUserOb: UserObject): string => {
                            return projectOb.permission.users[currentUserOb.username].role;
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'informationPage',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
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
                        inherit: true,
                        type: 'path',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    currentUserOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<UserObject, UsersResponse> => {
                            return resolveSvc.getCurrentUser();
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner();
                        },
                    ],
                    projectOb: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refresh: boolean
                        ): VePromise<ProjectObject, ProjectsResponse> => {
                            return resolveSvc.getProject(params, refresh);
                        },
                    ],
                    projectObs: [
                        'refresh',
                        'ResolveService',
                        'projectOb',
                        (
                            refresh: boolean,
                            resolveSvc: ResolveService,
                            projectOb: ProjectObject
                        ): VePromise<ProjectObject[], ProjectsResponse> => {
                            return resolveSvc.getProjects(projectOb, refresh);
                        },
                    ],
                    orgOb: [
                        'ResolveService',
                        'projectOb',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            projectOb: ProjectObject,
                            refresh: boolean
                        ): VePromise<OrgObject, OrgsResponse> => {
                            return resolveSvc.getProjectOrg(projectOb, refresh);
                        },
                    ],
                    orgObs: [
                        'refresh',
                        'ResolveService',
                        (refresh: boolean, resolveSvc: ResolveService): VePromise<OrgObject[], OrgsResponse> => {
                            return resolveSvc.getOrgs(refresh);
                        },
                    ],
                    refObs: [
                        'ResolveService',
                        'params',
                        (resolveSvc: ResolveService, params: ParamsObject): VePromise<RefObject[], RefsResponse> => {
                            return resolveSvc.getRefs(params);
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                        bindings: {
                            mmsBanner: 'bannerOb',
                        },
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
                        component: 'contextBar',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsProjectGroup: 'projectGroupOb',
                            mmsProjectGroups: 'projectGroupObs',
                            mmsRefs: 'refObs',
                            mmsRef: 'refOb',
                        },
                    },
                },
            })
            .state('main.project.ref', {
                // equivalent to old sites and documents page
                url: '/:refId',
                params: {
                    refId: {
                        inherit: true,
                        type: 'path',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    projectOb: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refresh: boolean
                        ): VePromise<MountObject, ProjectsResponse> => {
                            return resolveSvc.getProjectMounts(params, refresh);
                        },
                    ],
                    refOb: [
                        'ResolveService',
                        'params',
                        (resolveSvc: ResolveService, params: ParamsObject): VePromise<RefObject, RefsResponse> => {
                            return resolveSvc.getRef(params);
                        },
                    ],
                    projectGroupObs: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refresh: boolean
                        ): VePromise<ProjectGroupObject[], ProjectGroupsResponse> => {
                            return resolveSvc.getProjectGroups(params, refresh);
                        },
                    ],
                    documentObs: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject,
                            refresh: boolean
                        ): VePromise<DocumentObject[], GenericResponse<DocumentObject>> => {
                            return resolveSvc.getProjectDocuments(params, refresh);
                        },
                    ],
                    bannerOb: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getBanner(params);
                        },
                    ],
                    footerOb: [
                        'ResolveService',
                        'params',
                        (
                            resolveSvc: ResolveService,
                            params: ParamsObject
                        ): VePromise<BrandingStyle, ProjectsResponse> => {
                            return resolveSvc.getFooter(params);
                        },
                    ],
                    currentUserOb: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<UserObject, UsersResponse> => {
                            return resolveSvc.getCurrentUser();
                        },
                    ],
                    permission: [
                        'refOb',
                        'projectOb',
                        'ResolveService',
                        (
                            refOb: RefObject,
                            projectOb: ProjectObject,
                            resolveSvc: ResolveService
                        ): VePromise<PermissionCache, PermissionResponse> => {
                            return resolveSvc.initializePermission(projectOb.orgId, projectOb.id, refOb.id);
                        },
                    ],
                },
            })
            .state('main.project.ref.refs', {
                // manage refs given a current ref context
                url: '/refs',
                views: {
                    'pane-center@main': {
                        component: 'refs',
                        bindings: {
                            mmsOrg: 'orgOb',
                            mmsProject: 'projectOb',
                            mmsRefs: 'refObs',
                            mmsRef: 'refOb',
                        },
                    },
                    'toolbar-right@main': {
                        component: 'rightToolbar',
                        bindings: {
                            //Init an empty toolbar for style reasons
                        },
                    },
                    'toolbar-left@main': {
                        component: 'leftToolbar',
                        bindings: {
                            //Init an empty toolbar for style reasons
                        },
                    },
                },
            })
            .state('main.project.ref.portal', {
                url: '/portal',
                resolve: {
                    refresh: [
                        '$transition$',
                        ($transition$: Transition): boolean => {
                            const options = $transition$.options();
                            return options.reload === true || options.reload === 'true';
                        },
                    ],
                    documentOb: [
                        'params',
                        'refOb',
                        'projectOb',
                        'refresh',
                        'ResolveService',
                        (
                            params: ParamsObject,
                            refOb: RefObject,
                            projectOb: ProjectObject,
                            refresh: boolean,
                            resolveSvc: ResolveService
                        ): VePromise<DocumentObject> => {
                            return resolveSvc.getCoverDocument(params, refOb, projectOb, refresh);
                        },
                    ],
                    projectGroupOb: [
                        'projectGroupObs',
                        'documentOb',
                        'ResolveService',
                        (
                            projectGroupObs: ProjectGroupObject[],
                            documentOb: DocumentObject,
                            resolveSvc: ResolveService
                        ): ProjectGroupObject => {
                            return resolveSvc.getProjectGroup(projectGroupObs, documentOb);
                        },
                    ],
                    rootOb: [
                        'params',
                        'ResolveService',
                        (params: ParamsObject, resolveSvc: ResolveService): VePromise<PackageObject> => {
                            return resolveSvc.getProjectRoot(params);
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                        bindings: {
                            mmsBanner: 'bannerOb',
                        },
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
                        component: 'contextBar',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsGroup: 'projectGroupOb',
                            mmsGroups: 'projectGroupObs',
                            mmsRef: 'refOb',
                            mmsRefs: 'refObs',
                        },
                    },
                    'banner-bottom@main': {
                        component: 'systemFooter',
                        bindings: {
                            mmsFooter: 'footerOb',
                        },
                    },
                    'pane-center@main': {
                        component: 'slideshow',
                        bindings: {
                            mmsParams: 'params',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsGroup: 'projectGroupOb',
                            mmsDocument: 'documentOb',
                        },
                    },
                    'pane-left@main': {
                        component: 'leftPane',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsRoot: 'rootOb',
                        },
                    },
                    'pane-right@main': {
                        component: 'rightPane',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'rootOb',
                        },
                    },
                    'toolbar-right@main': {
                        component: 'rightToolbar',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'rootOb',
                        },
                    },
                    'toolbar-left@main': {
                        component: 'leftToolbar',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'rootOb',
                        },
                    },
                },
            })
            .state('main.project.ref.portal.preview', {
                url: '?preview',
                params: {
                    preview: {
                        inherit: true,
                        type: 'query',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
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
                            return resolveSvc.getPreviewDocument(params, refOb, refresh);
                        },
                    ],
                    projectGroupOb: [
                        'projectGroupObs',
                        'documentOb',
                        'ResolveService',
                        (
                            projectGroupObs: ProjectGroupObject[],
                            documentOb: DocumentObject,
                            resolveSvc: ResolveService
                        ): ProjectGroupObject => {
                            return resolveSvc.getProjectGroup(projectGroupObs, documentOb);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'slideshow',
                        bindings: {
                            mmsParams: 'params',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsGroup: 'projectGroupOb',
                            mmsDocument: 'documentOb',
                        },
                    },
                },
            })
            .state('main.project.ref.portal.docgen', {
                url: '/docgen?preview',
                params: {
                    preview: {
                        inherit: true,
                        type: 'query',
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
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
                            return resolveSvc.getPreviewDocument(params, refOb, refresh);
                        },
                    ],
                    projectGroupOb: [
                        'projectGroupObs',
                        'documentOb',
                        'ResolveService',
                        (
                            projectGroupObs: ProjectGroupObject[],
                            documentOb: DocumentObject,
                            resolveSvc: ResolveService
                        ): ProjectGroupObject => {
                            return resolveSvc.getProjectGroup(projectGroupObs, documentOb);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'docgen',
                        bindings: {
                            mmsParams: 'params',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsGroup: 'projectGroupOb',
                            mmsDocument: 'documentOb',
                        },
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
                        ): VePromise<DocumentObject[], GenericResponse<DocumentObject>> => {
                            return resolveSvc.getProjectDocuments(params);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'reorderGroup',
                        bindings: {
                            mmsGroups: 'projectGroupObs',
                            mmsDocuments: 'documentObs',
                        },
                    },
                },
            })
            .state('main.project.ref.manage', {
                //not needed right now, for managing mounts
                url: '/manage',
            })
            .state('main.project.ref.view', {
                url: '/:documentId',
                params: {
                    documentId: {
                        inherit: true,
                        type: 'path',
                        raw: true,
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
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
                            return resolveSvc.getProjectDocument(params, refresh);
                        },
                    ],
                    docMeta: [
                        'ViewService',
                        'documentOb',
                        (viewSvc: ViewService, documentOb: DocumentObject): VePromise<DocumentMetadata> => {
                            return viewSvc.getDocumentMetadata({
                                projectId: documentOb._projectId,
                                refId: documentOb._refId,
                                elementId: documentOb.id,
                            });
                        },
                    ],
                },
                views: {
                    'banner-top@main': {
                        component: 'systemBanner',
                        bindings: {
                            mmsBanner: 'bannerOb',
                        },
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
                        component: 'contextBar',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsProjects: 'projectObs',
                            mmsGroup: 'projectGroupOb',
                            mmsGroups: 'projectGroupObs',
                            mmsRef: 'refOb',
                            mmsRefs: 'refObs',
                            mmsRoot: 'documentOb',
                            mmsDocument: 'documentOb',
                        },
                    },
                    'banner-bottom@main': {
                        component: 'systemFooter',
                        bindings: {
                            mmsFooter: 'footerOb',
                        },
                    },
                    'pane-left@main': {
                        component: 'leftPane',
                        bindings: {
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsRoot: 'documentOb',
                        },
                    },
                    'pane-right@main': {
                        component: 'rightPane',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'documentOb',
                        },
                    },
                    'toolbar-right@main': {
                        component: 'rightToolbar',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'documentOb',
                        },
                    },
                    'toolbar-left@main': {
                        component: 'leftToolbar',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'documentOb',
                        },
                    },
                },
            })
            .state('main.project.ref.view.present', {
                url: '/present?viewId&display',
                params: {
                    viewId: {
                        inherit: true,
                        type: 'query',
                        value: null,
                        squash: true,
                        raw: true,
                        dynamic: true,
                    },
                    display: {
                        inherit: true,
                        type: 'query',
                        value: 'slideshow',
                        squash: true,
                        raw: true,
                    },
                },
                resolve: {
                    params: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                    viewOb: [
                        'ResolveService',
                        'params',
                        'refresh',
                        (resolveSvc: ResolveService, params: ParamsObject, refresh: boolean): VePromise<ViewObject> => {
                            if (params.viewId) {
                                return resolveSvc.getView(params, refresh);
                            } else {
                                return null;
                            }
                        },
                    ],
                },
            })
            .state('main.project.ref.view.present.slideshow', {
                views: {
                    'pane-center@main': {
                        component: 'slideshow',
                        bindings: {
                            mmsParams: 'params',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsDocument: 'documentOb',
                            mmsView: 'viewOb',
                            mmsDocMeta: 'docMeta',
                        },
                    },
                },
            })
            .state('main.project.ref.view.present.document', {
                views: {
                    'pane-center@main': {
                        component: 'document',
                        bindings: {
                            mmsParams: 'params',
                            mmsProject: 'projectOb',
                            mmsRef: 'refOb',
                            mmsDocument: 'documentOb',
                            mmsView: 'viewOb',
                            mmsDocMeta: 'docMeta',
                        },
                    },
                },
            })
            .state('main.project.ref.view.reorder', {
                url: '/order',

                resolve: {
                    documentOb: [
                        'params',
                        'ResolveService',
                        (params: ParamsObject, resolveSvc: ResolveService): VePromise<DocumentObject> => {
                            return resolveSvc.getProjectDocument(params, true);
                        },
                    ],
                },
                views: {
                    'pane-center@main': {
                        component: 'reorderDocument',
                        bindings: {
                            mmsDocument: 'documentOb',
                        },
                    },
                },
            })

            .state('main.project.ref.search', {
                url: '/search?keywords&field',
                params: {
                    keywords: {
                        dynamic: true,
                    },
                    field: {
                        dynamic: true,
                    },
                },
                resolve: {
                    paramsOb: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                },
                views: {
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
                    'pane-center@main': {
                        component: 'search',
                        bindings: {
                            params: 'paramsOb',
                        },
                    },
                    'pane-right@main': {
                        component: 'rightPane',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'documentOb',
                        },
                    },
                    'toolbar-right@main': {
                        component: 'rightToolbar',
                        bindings: {
                            mmsRef: 'refOb',
                            mmsRoot: 'documentOb',
                        },
                    },
                    'toolbar-left@main': {
                        component: 'leftToolbar',
                        bindings: {
                            //Init an empty toolbar for style reasons
                        },
                    },
                },
            })
            .state('main.share', {
                url: '/s/:shortUrl',
                resolve: {
                    token: [
                        'ResolveService',
                        (resolveSvc: ResolveService): VePromise<string, CheckAuthResponse> => {
                            return resolveSvc.getToken();
                        },
                    ],
                    paramsOb: [
                        '$transition$',
                        ($transition$: Transition): ParamsObject => {
                            return $transition$.params();
                        },
                    ],
                },
                views: {
                    'login@main': {
                        component: 'shortUrl',
                    },
                },
            });

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
                        if (config.url != uRLSvc.getAuthenticationUrl()) {
                            config.headers = uRLSvc.getAuthorizationHeader(config.headers);
                        } else {
                            console.log('IM DOING IT MOM');
                        }
                        if (!config.timeout) {
                            config.cancel = $q.defer();
                            config.timeout = config.cancel.promise;
                        } else {
                            console.log(config.url);
                        }
                        return config;
                    },
                    responseError: (
                        rejection: IHttpResponse<any>
                    ): IPromise<IHttpResponse<any>> | IHttpResponse<any> => {
                        const timeout: IPromise<string> = rejection.config.timeout as IPromise<string>;
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
                    },
                    response: (response): IHttpResponse<any> => {
                        if (response.status === 202) {
                            eventSvc.$broadcast('mms.working', response);
                        }
                        response.status = 501;
                        return response;
                    },
                };
            },
        ]);

        $httpProvider.useApplyAsync(true);

        // $uiRouterProvider.urlService.rules.otherwise((match, url: UrlParts | undefined) => {
        //     console.log(url);
        // })
    },
]);

veApp.run([
    '$q',
    '$http',
    '$interval',
    '$location',
    '$uibModal',
    '$urlService',
    '$uiRouterGlobals',
    '$state',
    '$transitions',
    'RootScopeService',
    'AuthService',
    'EventService',
    'ApplicationService',
    function (
        $q: IQService,
        $http: IHttpService,
        $interval: IIntervalService,
        $location: ILocationService,
        $uibModal: VeModalService,
        $urlService: UrlService,
        $uiRouterGlobals: UIRouterGlobals,
        $state: StateService,
        $transitions: TransitionService,
        rootScopeSvc: RootScopeService,
        authSvc: AuthService,
        eventSvc: EventService,
        applicationSvc: ApplicationService
    ): void {
        rootScopeSvc.loginModalOpen(false);
        $transitions.onBefore({}, (transition: Transition) => {
            const to = transition.$to().name;
            const params: ParamsObject = transition.params();
            if (to === 'main.login' || rootScopeSvc.loginModalOpen()) {
                if (params.next) {
                    $urlService.url(params.next, true);
                }
                return;
            }
            return new Promise((resolve) => {
                authSvc.checkLogin().then(
                    () => {
                        if (to === 'main') {
                            resolve($state.target('main.login.select'));
                        } else if (to === 'main.project.ref') {
                            resolve($state.target('main.project.ref.portal'));
                        } else if (to === 'main.project.ref.view.present') {
                            if (!params.display || params.display === '') {
                                params.display = 'slideshow';
                            }
                            resolve($state.target('main.project.ref.view.present.' + params.display, params));
                        } else if ($state.includes('*.present.**') && !(transition.params() as ParamsObject).display) {
                            const display = transition.$to().name.split('.')[transition.$to().name.split('.').length];
                            resolve(
                                $state.target(transition.$to().name, {
                                    display,
                                })
                            );
                        } else {
                            resolve();
                        }
                    },
                    () => {
                        $http.pendingRequests.forEach((pendingReq) => {
                            if (pendingReq.cancel) {
                                pendingReq.cancel.resolve('cancelled');
                            }
                        });
                        resolve(
                            $state.target('main.login', {
                                next: $urlService.url(),
                            })
                        );
                    }
                );
            });
        });
        $transitions.onError({}, (reason) => {
            console.log(reason);
            //console.log(reason.error());
        });
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
                    ($uiRouterGlobals.transition && $uiRouterGlobals.transition.$to.name === 'main.login.select')
                ) {
                    void $state.go('main.login');
                }
                return;
            }

            authSvc.checkLogin().then(
                () => {
                    /* do nothing if success */
                },
                () => {
                    rootScopeSvc.loginModalOpen(true);
                    $uibModal
                        .open<LoginModalResolveFn, boolean>({
                            component: 'loginModal',
                            resolve: {
                                continue: () => {
                                    return true;
                                },
                            },
                            backdrop: 'static',
                            size: 'md',
                        })
                        .result.finally(() => {
                            rootScopeSvc.loginModalOpen(false);
                        });
                }
            );
        });

        // broadcast mms.unauthorized every 10 minutes with interval service
        void $interval(
            () => {
                eventSvc.$broadcast('mms.unauthorized');
            },
            window.__env.loginTimeout ? window.__env.loginTimeout : 60000,
            0,
            false
        );

        // Check if user is logged in, if so redirect to select page otherwise go to login if the url isn't mapped
        $urlService.rules.otherwise((match, url: UrlParts | undefined) => {
            void authSvc.checkLogin().then(
                () => {
                    if ($location.url().includes('workspace')) {
                        rootScopeSvc.veRedirectFromOld(true);
                        rootScopeSvc.veCrushUrl($location.path());
                        void $state.go('main.login.redirect');
                    } else {
                        rootScopeSvc.veRedirectFromOld(false);
                        void $state.go('main.login.select');
                    }
                },
                (response) => {
                    void $state.go('main.login');
                }
            );
        });
    },
]);

/*
veApp.run([
    '$uiRouter',
    '$trace',
    ($uiRouter: UIRouter, $trace: Trace): void => {
        if (window.__env.enableDebug) {
            const pluginInstance = $uiRouter.plugin(Visualizer)
            $trace.enable('TRANSITION')
        }
    },
])
*/
