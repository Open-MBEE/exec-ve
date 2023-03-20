import { UIRouter } from '@uirouter/angularjs'

import {
    BrandingService,
    BrandingStyle,
    ShortUrlService,
} from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import {
    AuthService,
    ElementService,
    PermissionCache,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'

import { veApp } from '@ve-app'

import { VePromise, VeQService } from '@ve-types/angular'
import {
    CheckAuthResponse,
    DocumentObject,
    GroupObject,
    GroupsResponse,
    MountObject,
    OrgObject,
    OrgsResponse,
    PackageObject,
    ParamsObject,
    PermissionsResponse,
    ProjectObject,
    ProjectsResponse,
    RefObject,
    RefsResponse,
    ViewObject,
} from '@ve-types/mms'
import { VeStorageService } from '@ve-types/view-editor'

export class ResolveService {
    static $inject = [
        '$localStorage',
        '$q',
        'growl',
        '$cookies',
        '$uiRouter',
        'ShortUrlService',
        'BrandingService',
        'URLService',
        'AuthService',
        'ProjectService',
        'ViewService',
        'ElementService',
        'PermissionsService',
        'EventService',
    ]

    constructor(
        private $localStorage: VeStorageService,
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private $cookies: angular.cookies.ICookiesService,
        private $uiRouter: UIRouter,
        private shortUrlSvc: ShortUrlService,
        private brandingSvc: BrandingService,
        private uRLSvc: URLService,
        private authSvc: AuthService,
        private projectSvc: ProjectService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private permissionsSvc: PermissionsService,
        private eventSvc: EventService
    ) {}

    public getBanner(
        params?: ParamsObject
    ): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getBanner(params)
    }

    public getLoginBanner(): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getLoginBanner()
    }

    public getFooter(
        params?: ParamsObject
    ): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getFooter(params)
    }

    public getToken(): VePromise<string, CheckAuthResponse> {
        const deferred = this.$q.defer<string>()
        this.authSvc.checkLogin().then(
            (data) => {
                this.uRLSvc.setToken(this.$localStorage.token)
                deferred.resolve(this.$localStorage.token)
                this.$cookies.put(
                    'com.tomsawyer.web.license.user',
                    data.username,
                    { path: '/' }
                )
            },
            (rejection) => {
                deferred.reject(rejection)
            }
        )
        return deferred.promise
    }

    public getOrg(
        projectOb: ProjectObject
    ): VePromise<OrgObject, OrgsResponse> {
        const promise = this.projectSvc.getOrg(projectOb.orgId)
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsOrg', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getOrgs(): VePromise<OrgObject[], OrgsResponse> {
        const promise = this.projectSvc.getOrgs()
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsOrgs', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getProject(
        params: ParamsObject
    ): VePromise<ProjectObject, ProjectsResponse> {
        const promise = this.projectSvc.getProject(params.projectId)
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsProject', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getProjects(
        projectOb: ProjectObject,
        refresh?: boolean
    ): VePromise<ProjectObject[], ProjectsResponse> {
        const promise = this.projectSvc.getProjects(projectOb.orgId, refresh)
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsProjects', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getProjectMounts(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<MountObject, ProjectsResponse> {
        const promise = this.projectSvc.getProjectMounts(
            params.projectId,
            params.refId,
            refresh
        )

        promise.then(
            (result) => {
                this.eventSvc.resolve<MountObject>('mmsProject', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getRef(params: ParamsObject): VePromise<RefObject, RefsResponse> {
        const promise = this.projectSvc.getRef(params.refId, params.projectId)
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsRef', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getRefs(params: ParamsObject): VePromise<RefObject[], RefsResponse> {
        const promise = this.projectSvc.getRefs(params.projectId)
        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsRefs', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getGroups(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<GroupObject[], GroupsResponse> {
        const promise = this.projectSvc.getGroups(
            params.projectId,
            params.refId,
            refresh
        )

        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsGroups', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getGroup(
        groupObs: GroupObject[],
        documentOb: DocumentObject
    ): GroupObject {
        let group: GroupObject = null
        if (documentOb) {
            for (let i = 0; i < groupObs.length; i++) {
                if (groupObs[i].id == documentOb._groupId) {
                    group = groupObs[i]
                    break
                }
            }
        }
        this.eventSvc.resolve('mmsGroup', group)
        return group
    }

    public getProjectRoot(params: ParamsObject): VePromise<PackageObject> {
        return this.elementSvc.getElement({
            projectId: params.projectId,
            refId: params.refId,
            elementId: params.projectId + '_pm',
        })
    }

    public getCoverDocument(
        params: ParamsObject,
        refOb: RefObject,
        projectOb: ProjectObject,
        refresh?: boolean
    ): VePromise<DocumentObject> {
        const deferred = this.$q.defer<DocumentObject>()
        const eid = params.projectId + '_cover'
        this.elementSvc
            .getElement<DocumentObject>(
                {
                    projectId: params.projectId,
                    refId: params.refId,
                    elementId: eid,
                },
                2,
                refresh
            )
            .then(
                (data) => {
                    this.eventSvc.resolve<DocumentObject>('mmsDocument', data)
                    if (!data._groupId) data._groupId = params.projectId + '_pm'
                    deferred.resolve(data)
                },
                (reason) => {
                    if (reason.status === 404) {
                        if (refOb.type === 'Tag') {
                            deferred.resolve(null)
                        } else {
                            this.viewSvc
                                .createView(
                                    {
                                        _projectId: params.projectId,
                                        _refId: params.refId,
                                        id: 'holding_bin_' + params.projectId,
                                    },
                                    {
                                        name: projectOb.name + ' Cover Page',
                                        id: eid,
                                        _projectId: params.projectId,
                                        _refId: params.refId,
                                        documentation: '',
                                        _groupId: params.projectId + '_pm',
                                    }
                                )
                                .then(
                                    (data) => {
                                        this.eventSvc.resolve(
                                            'mmsDocument',
                                            data
                                        )
                                        deferred.resolve(data)
                                    },
                                    (reason2) => {
                                        deferred.resolve(null)
                                    }
                                )
                        }
                    } else if (reason.status === 410) {
                        //resurrect
                        let name = projectOb.name + ' Cover Page '
                        try {
                            name = `${reason.data.deleted[0].name} `
                        } catch (e) {}
                        this.elementSvc
                            .updateElements([
                                {
                                    _projectId: params.projectId,
                                    _refId: params.refId,
                                    id: eid,
                                    name: name,
                                    type: 'Class',
                                },
                                {
                                    _projectId: params.projectId,
                                    _refId: params.refId,
                                    id: eid + '_asi',
                                    name: ' ',
                                    type: 'InstanceSpecification',
                                    ownerId: eid,
                                },
                            ])
                            .then(
                                (data) => {
                                    let resolved = false
                                    if (data.length > 0) {
                                        data.forEach((e) => {
                                            if (e.id == eid) {
                                                deferred.resolve(e)
                                                resolved = true
                                            }
                                        })
                                    }
                                    if (!resolved) {
                                        deferred.resolve(null)
                                    }
                                },
                                () => {
                                    deferred.resolve(null)
                                }
                            )
                    } else {
                        deferred.resolve(null) //let user get into project
                    }
                }
            )
        return deferred.promise
    }

    public getPreviewDocument(
        params: ParamsObject,
        refOb: RefObject,
        refresh?: boolean
    ): VePromise<DocumentObject> {
        const deferred = this.$q.defer<DocumentObject>()
        const eid: string = params.preview
        const coverIndex = eid.indexOf('_cover')
        if (coverIndex > 0) {
            const groupId = eid.substring(5, coverIndex)
            this.elementSvc
                .getElement(
                    {
                        projectId: params.projectId,
                        refId: params.refId,
                        extended: true,
                        elementId: eid,
                    },
                    2,
                    refresh
                )
                .then(
                    (data) => {
                        this.eventSvc.resolve('mmsDocument', data)
                        deferred.resolve(data)
                    },
                    (reason) => {
                        if (reason.status === 404) {
                            if (refOb.type === 'Tag') {
                                deferred.resolve(null)
                            } else {
                                const viewDoc =
                                    '<transclude-group-docs mms-group-id="' +
                                    groupId +
                                    '">[cf:group docs]</transclude-group-docs>'
                                this.elementSvc
                                    .getElement(
                                        {
                                            projectId: params.projectId,
                                            refId: params.refId,
                                            elementId: groupId,
                                        },
                                        2,
                                        refresh
                                    )
                                    .then(
                                        (groupElement) => {
                                            this.viewSvc
                                                .createView(
                                                    {
                                                        _projectId:
                                                            params.projectId,
                                                        _refId: params.refId,
                                                        id: groupId,
                                                    },
                                                    {
                                                        name:
                                                            groupElement.name +
                                                            ' Cover Page',
                                                        id: eid,
                                                        _projectId:
                                                            params.projectId,
                                                        _refId: params.refId,
                                                        type: 'Class',
                                                        documentation: viewDoc,
                                                    }
                                                )
                                                .then(
                                                    (data) => {
                                                        this.eventSvc.resolve(
                                                            'mmsDocument',
                                                            data
                                                        )
                                                        deferred.resolve(data)
                                                    },
                                                    (reason3) => {
                                                        deferred.reject(reason)
                                                    }
                                                )
                                        },
                                        (reason2) => {
                                            deferred.reject(reason2)
                                        }
                                    )
                            }
                        } else {
                            deferred.reject(reason)
                        }
                    }
                )
        } else {
            this.getProjectDocument(params, refresh).then(
                (data) => {
                    deferred.resolve(data)
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        }
        return deferred.promise
    }

    public getProjectDocument(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<ViewObject> {
        const promise = this.elementSvc.getElement(
            {
                projectId: params.projectId,
                refId: params.refId,
                elementId: params.preview ? params.preview : params.documentId,
            },
            2,
            refresh
        )

        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsDocument', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getProjectDocuments(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<DocumentObject[]> {
        const promise = this.viewSvc.getProjectDocuments(
            {
                projectId: params.projectId,
                refId: params.refId,
            },
            2,
            refresh
        )

        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsDocuments', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getView(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<ViewObject> {
        const promise = this.elementSvc.getElement(
            {
                projectId: params.projectId,
                refId: params.refId,
                elementId: params.viewId,
            },
            2,
            refresh
        )

        promise.then(
            (result) => {
                this.eventSvc.resolve('mmsView', result)
            },
            (reason) => {
                this.growl.error('Resolve Error: ' + reason.message)
            }
        )
        return promise
    }

    public getSearch = (params: ParamsObject): string => {
        if (params.search === undefined) {
            return null
        }
        return params.search
    }

    public getField = (params: ParamsObject): string => {
        if (params.field === undefined) {
            return 'all'
        }
        return params.field
    }

    public initializePermissions(
        projectOb: ProjectObject,
        refOb: RefObject
    ): VePromise<PermissionCache, PermissionsResponse> {
        return this.permissionsSvc.initializePermissions(projectOb, refOb)
    }
}

veApp.service('ResolveService', ResolveService)
