import { UIRouter } from '@uirouter/angularjs'
import angular from 'angular'

import {
    AuthService,
    ElementService,
    PermissionCache,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import {
    ApplicationService,
    BrandingService,
    BrandingStyle,
    ShortenUrlService,
} from '@ve-utils/services'

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
        '$cookies',
        '$uiRouter',
        'ShortenUrlService',
        'BrandingService',
        'URLService',
        'AuthService',
        'ProjectService',
        'ApplicationService',
        'ViewService',
        'ElementService',
        'PermissionsService',
    ]

    constructor(
        private $localStorage: VeStorageService,
        private $q: VeQService,
        private $cookies: angular.cookies.ICookiesService,
        private $uiRouter: UIRouter,
        private shortenUrlSvc: ShortenUrlService,
        private brandingSvc: BrandingService,
        private uRLSvc: URLService,
        private authSvc: AuthService,
        private projectSvc: ProjectService,
        private applicationSvc: ApplicationService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private permissionsSvc: PermissionsService
    ) {}

    public getBanner(): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getBanner()
    }

    public getLoginBanner(): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getLoginBanner()
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
        return this.projectSvc.getOrg(projectOb.orgId)
    }

    public getOrgs(): VePromise<OrgObject[], OrgsResponse> {
        return this.projectSvc.getOrgs()
    }

    public getProject(
        params: ParamsObject
    ): VePromise<ProjectObject, ProjectsResponse> {
        return this.projectSvc.getProject(params.projectId)
    }

    public getProjects(
        projectOb: ProjectObject
    ): VePromise<ProjectObject[], ProjectsResponse> {
        return this.projectSvc.getProjects(projectOb.orgId)
    }

    public getProjectMounts(
        params: ParamsObject
    ): VePromise<MountObject, ProjectsResponse> {
        return this.projectSvc.getProjectMounts(
            params.projectId,
            params.refId,
            true
        )
    }

    public getRef(params: ParamsObject): VePromise<RefObject, RefsResponse> {
        return this.projectSvc.getRef(params.refId, params.projectId)
    }

    public getRefs(params: ParamsObject): VePromise<RefObject[], RefsResponse> {
        return this.projectSvc.getRefs(params.projectId)
    }

    private _filterRefs(refType: string, refObs: RefObject[]): RefObject[] {
        const ret: RefObject[] = []
        refObs.forEach((ref: RefObject) => {
            if (ref.type === refType) {
                ret.push(ref)
            }
        })
        return ret
    }

    public getTag = (refOb: RefObject): RefObject => {
        return this._filterRefs('Tag', [refOb])[0]
    }

    public getTags(refObs: RefObject[]): RefObject[] {
        return this._filterRefs('Tag', refObs)
    }

    public getBranch = (refOb: RefObject): RefObject => {
        return this._filterRefs('Branch', [refOb])[0]
    }

    public getBranches(refObs: RefObject[]): RefObject[] {
        return this._filterRefs('Branch', refObs)
    }

    public getGroups(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<GroupObject[], GroupsResponse> {
        return this.projectSvc.getGroups(
            params.projectId,
            params.refId,
            refresh
        )
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
        return group
    }

    public getDocument(
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
                                    }
                                )
                                .then(
                                    (data) => {
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

    public getDocumentPreview(
        params: ParamsObject,
        refOb: RefObject,
        refresh?: boolean
    ): VePromise<DocumentObject> {
        const deferred = this.$q.defer<DocumentObject>()
        const eid: string = params.documentId
        const coverIndex = eid.indexOf('_cover')
        if (coverIndex > 0) {
            const groupId = eid.substring(5, coverIndex)
            this.viewSvc
                .getProjectDocument(
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
        return this.viewSvc.getProjectDocument(
            {
                projectId: params.projectId,
                refId: params.refId,
                elementId: params.documentId,
            },
            2,
            refresh
        )
    }

    public getProjectDocuments(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<DocumentObject[]> {
        return this.viewSvc.getProjectDocuments(
            {
                projectId: params.projectId,
                refId: params.refId,
            },
            2,
            refresh
        )
    }

    public getView(
        params: ParamsObject,
        refresh?: boolean
    ): VePromise<ViewObject> {
        return this.elementSvc.getElement(
            {
                projectId: params.projectId,
                refId: params.refId,
                elementId: params.viewId,
            },
            2,
            refresh
        )
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

    public getFooter(): VePromise<BrandingStyle, ProjectsResponse> {
        return this.brandingSvc.getFooter()
    }

    public initializePermissions(
        projectOb: ProjectObject,
        refOb: RefObject
    ): VePromise<PermissionCache, PermissionsResponse> {
        return this.permissionsSvc.initializePermissions(projectOb, refOb)
    }
}

veApp.service('ResolveService', ResolveService)
