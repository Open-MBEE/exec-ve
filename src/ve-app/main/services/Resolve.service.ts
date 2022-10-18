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
} from '@ve-utils/services'

import { veApp } from '@ve-app'

import {
    DocumentObject,
    ElementObject,
    ElementsResponse,
    MountObject,
    OrgObject,
    ParamsObject,
    ProjectObject,
    RefObject,
    RequestObject,
    ViewObject,
} from '@ve-types/mms'

export class ResolveService {
    static $inject = [
        '$window',
        '$q',
        '$cookies',
        '$uiRouter',
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
        private $window: angular.IWindowService,
        private $q: angular.IQService,
        private $cookies: angular.cookies.ICookiesService,
        private $uiRouter: UIRouter,
        private brandingSvc: BrandingService,
        private uRLSvc: URLService,
        private authSvc: AuthService,
        private projectSvc: ProjectService,
        private applicationSvc: ApplicationService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private permissionsSvc: PermissionsService
    ) {}

    public getBanner(): BrandingStyle {
        return this.brandingSvc.getBanner()
    }

    public getLoginBanner(): BrandingStyle {
        return this.brandingSvc.getLoginBanner()
    }
    public getToken(): angular.IPromise<string> {
        const deferred: angular.IDeferred<string> = this.$q.defer()
        this.authSvc.checkLogin().then(
            (data) => {
                this.uRLSvc.setToken(this.$window.localStorage.getItem('token'))
                deferred.resolve(this.$window.localStorage.getItem('token'))
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

    public getOrg(projectOb: ProjectObject): angular.IPromise<OrgObject> {
        return this.projectSvc.getOrg(projectOb.orgId)
    }

    public getOrgs(): angular.IPromise<OrgObject[]> {
        return this.projectSvc.getOrgs()
    }

    public getProject(params: ParamsObject): angular.IPromise<ProjectObject> {
        return this.projectSvc.getProject(params.projectId)
    }

    public getProjects(
        projectOb: ProjectObject
    ): angular.IPromise<ProjectObject[]> {
        return this.projectSvc.getProjects(projectOb.orgId)
    }

    public getProjectMounts(
        params: ParamsObject
    ): angular.IPromise<MountObject[]> {
        return this.projectSvc.getProjectMounts(
            params.projectId,
            params.refId,
            true
        )
    }

    public getRef(params: ParamsObject) {
        return this.projectSvc.getRef(params.refId, params.projectId)
    }

    public getRefs(params: ParamsObject) {
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

    public getTag(refOb: RefObject): RefObject {
        return this._filterRefs('Tag', [refOb])[0]
    }

    public getTags(refObs: RefObject[]): RefObject[] {
        return this._filterRefs('Tag', refObs)
    }

    public getBranch(refOb: RefObject): RefObject {
        return this._filterRefs('Branch', [refOb])[0]
    }

    public getBranches(refObs: RefObject[]): RefObject[] {
        return this._filterRefs('Branch', refObs)
    }

    public getGroups(
        params: ParamsObject,
        refresh?: boolean
    ): angular.IPromise<ElementObject[]> {
        return this.projectSvc.getGroups(
            params.projectId,
            params.refId,
            refresh
        )
    }

    public getGroup(
        groupObs: ElementObject[],
        documentOb: DocumentObject
    ): ElementObject {
        let group: ElementObject = null
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
    ): angular.IPromise<ViewObject> {
        const deferred: angular.IDeferred<ViewObject> = this.$q.defer()
        const eid = params.projectId + '_cover'
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
                    deferred.resolve(data)
                },
                (reason: angular.IHttpResponse<ElementsResponse>) => {
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
                                        type: 'Class',
                                    },
                                    ''
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
    ): angular.IPromise<ElementObject> {
        const deferred: angular.IDeferred<ElementObject> = this.$q.defer()
        const eid: string = params.documentId
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
                        deferred.resolve(data)
                    },
                    (reason: angular.IHttpResponse<ElementsResponse>) => {
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
                                                    },
                                                    viewDoc
                                                )
                                                .then(
                                                    (data) => {
                                                        deferred.resolve(data)
                                                    },
                                                    (
                                                        reason3: angular.IHttpResponse<ElementsResponse>
                                                    ) => {
                                                        deferred.reject(reason)
                                                    }
                                                )
                                        },
                                        (
                                            reason2: angular.IHttpResponse<ElementsResponse>
                                        ) => {
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
    ): angular.IPromise<ViewObject> {
        return this.viewSvc.getProjectDocument(
            {
                projectId: params.projectId,
                refId: params.refId,
                extended: false,
                documentId: params.documentId,
            },
            2,
            refresh
        )
    }

    public getProjectDocuments(
        params: ParamsObject,
        refresh?: boolean
    ): angular.IPromise<DocumentObject[]> {
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
    ): angular.IPromise<ViewObject> {
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

    public getSearch(params: ParamsObject) {
        if (params.search === undefined) {
            return null
        }
        return params.search
    }

    public getField(params: ParamsObject) {
        if (params.field === undefined) {
            return 'all'
        }
        return params.field
    }

    public getFooter(): BrandingStyle {
        return this.brandingSvc.getFooter()
    }

    public initializePermissions(
        projectOb: ProjectObject,
        refOb: RefObject
    ): angular.IPromise<PermissionCache> {
        return this.permissionsSvc.initializePermissions(projectOb, refOb)
    }
}

veApp.service('ResolveService', ResolveService)
