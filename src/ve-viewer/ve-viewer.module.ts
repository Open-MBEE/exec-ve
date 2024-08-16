import uiRouter, { StateProvider, Transition } from '@uirouter/angularjs';
import angular from 'angular';

import { ResolveService } from '@ve-core/services';
import { BrandingStyle } from '@ve-utils/application';
import { PermissionCache, ViewService, DocumentMetadata } from '@ve-utils/mms-api-client';

import { VePromise } from '@ve-types/angular';
import {
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
    UserObject,
    UsersResponse,
    ViewObject,
    ProjectGroupsResponse,
} from '@ve-types/mms';

/**
 *
 * @type {angular.IModule}
 */
export const veViewer = angular.module('ve-viewer', [
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
veViewer
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
                            (
                                resolveSvc: ResolveService,
                                params: ParamsObject
                            ): VePromise<RefObject[], RefsResponse> => {
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
                                mmsDocMeta: 'docMeta',
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
                            (
                                resolveSvc: ResolveService,
                                params: ParamsObject,
                                refresh: boolean
                            ): VePromise<ViewObject> => {
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
        },
    ]);
