import uiRouter, { StateProvider, Transition } from '@uirouter/angularjs';
import angular from 'angular';

import { ResolveService } from '@ve-core/services';
import { BrandingStyle } from '@ve-utils/application';

import { VePromise } from '@ve-types/angular';
import {
    AdminObject,
    CheckAuthResponse,
    OrgObject,
    OrgsResponse,
    ParamsObject,
    ProjectObject,
    ProjectsResponse,
    RefObject,
    RefsResponse,
    UserGroupsResponse,
    UserObject,
    UsersResponse,
    GroupObject,
    GroupsResponse,
    GroupUsersResponse,
} from '@ve-types/mms';

/**
 *
 * @type {angular.IModule}
 */
export const veAdmin = angular.module('ve-admin', [
    've-utils',
    've-core',
    've-components',
    'ui.bootstrap',
    'angular-growl',
    uiRouter,
    // 'ngSanitize',
]);

// veComponents.config(['$sanitizeProvider', function($sanitizeProvider: angular.sanitize.ISanitizeProvider) {
//     $sanitizeProvider.addValidElements({
//         htmlElements: ['mms-cf', 'mms-view-link', 'transclude-doc', 'transclude-val', 'transclude-name', 'transclude-view'],
//     })
//         .addValidAttrs(['mms-data', 'mms-cf-type', 'mms-element-id', 'mms-project-id', 'mms-ref-id',
//             'mms-commit-id', 'mms-watch-id', 'non-editable', 'mms-generate-for-diff'])
//         .enableSvg()
// }])
veAdmin
    .filter('veRealNum', () => {
        return (n: string | number): string => {
            if (Number.isInteger(n)) {
                return `${n}.0`;
            }
            return n as string;
        };
    })
    .constant('CKEDITOR', window.CKEDITOR)
    .config([
        '$stateProvider',
        function ($stateProvider: StateProvider): void {
            $stateProvider
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
                .state('main.admin.users', {
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
                .state('main.admin.user', {
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
                .state('main.admin.groups', {
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
                .state('main.admin.group', {
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
                .state('main.admin.orgs', {
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
                            component: 'organizationList',
                            bindings: {
                                mmsOrgs: 'orgObs',
                                currentUser: 'currentUserOb',
                            },
                        },
                    },
                })
                .state('main.admin.org', {
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
                .state('main.admin.org.projects', {
                    url: '/projects',
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
                .state('main.admin.projects', {
                    url: '/projects',
                    views: {
                        'pane-center@main': {
                            component: 'projectList',
                            bindings: {
                                mmsOrgs: 'orgObs',
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
                        projectObs: [
                            'projectOb',
                            'refresh',
                            'ResolveService',
                            (
                                projectOb: ProjectObject,
                                refresh: boolean,
                                resolveSvc: ResolveService
                            ): VePromise<ProjectObject[], ProjectsResponse> => {
                                return resolveSvc.getProjects(projectOb, refresh);
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
                });
        },
    ]);
