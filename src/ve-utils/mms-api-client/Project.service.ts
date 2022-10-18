import angular from 'angular'

import {
    ApiService,
    CacheService,
    ElementService,
    URLService,
} from '@ve-utils/mms-api-client'

import { veUtils } from '@ve-utils'

import {
    CommitObject,
    CommitResponse,
    ElementObject,
    GroupsResponse,
    MmsObject,
    MountObject,
    OrgObject,
    OrgsResponse,
    ProjectObject,
    ProjectsResponse,
    RefObject,
    RefsResponse,
    RequestObject,
} from '@ve-types/mms'
import { VePromiseReason } from '@ve-types/view-editor'

/**
 * @ngdoc service
 * @name ProjectService
 * @requires $q
 * @requires $http
 * @requires ApplicationService
 * @requires CacheService
 * @requires ElementService
 * @requires URLService
 * @requires _
 *
 * @description
 * This is a utility service for getting project, ref, commit information
 */
export class ProjectService {
    private inProgress: {
        [url: string]: angular.IPromise<MmsObject | MmsObject[]>
    } = {}

    static $inject = [
        '$q',
        '$http',
        'CacheService',
        'ElementService',
        'URLService',
        'ApiService',
    ]
    constructor(
        private $q: angular.IQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private uRLSvc: URLService,
        private apiSvc: ApiService
    ) {}

    /**
     * @ngdoc method
     * @name ProjectService#getOrg
     * @methodOf ProjectService
     *
     * @description
     * Gets org information from mms
     *
     * @param {string} orgId id of org
     * @returns {Promise} Resolves to the org object.
     */
    public getOrg(orgId: string): angular.IPromise<OrgObject> {
        const deferred: angular.IDeferred<OrgObject> = this.$q.defer()
        const key = ['org', orgId]
        const urlkey = this.uRLSvc.getOrgURL(orgId)
        if (this.inProgress.hasOwnProperty(urlkey)) {
            return this.inProgress[urlkey] as angular.IPromise<OrgObject>
        }
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get<OrgObject>(key))
        } else {
            this.inProgress[urlkey] = deferred.promise
            this.$http
                .get(urlkey)
                .then(
                    (response: angular.IHttpResponse<OrgsResponse>) => {
                        if (
                            !response.data.orgs ||
                            response.data.orgs.length < 1
                        ) {
                            deferred.reject({
                                status: 404,
                                data: '',
                                message: 'Org not found',
                            })
                        } else {
                            this.cacheSvc.put(key, response.data.orgs[0], true)
                            deferred.resolve(this.cacheSvc.get<OrgObject>(key))
                        }
                    },
                    (response: angular.IHttpResponse<OrgObject>) =>
                        this.apiSvc.handleErrorCallback<OrgObject, OrgObject>(
                            response,
                            deferred
                        )
                )
                .finally(() => {
                    delete this.inProgress[urlkey]
                })
        }
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ProjectService#getOrgs
     * @methodOf ProjectService
     *
     * @description
     * Gets orgs information
     *
     * @returns {Promise} Resolves into array of org objects.
     */
    public getOrgs(ignoreCache?: boolean): angular.IPromise<OrgObject[]> {
        const key = 'orgs'
        if (this.inProgress.hasOwnProperty(key)) {
            return this.inProgress[key] as angular.IPromise<OrgObject[]>
        }
        const deferred: angular.IDeferred<OrgObject[]> = this.$q.defer()
        if (this.cacheSvc.exists(key) && !ignoreCache) {
            deferred.resolve(this.cacheSvc.get<OrgObject[]>(key))
        } else {
            this.inProgress[key] = deferred.promise
            this.$http
                .get<OrgsResponse>(this.uRLSvc.getOrgsURL())
                .then(
                    (response) => {
                        const orgs: OrgObject[] = []
                        for (let i = 0; i < response.data.orgs.length; i++) {
                            const org = response.data.orgs[i]
                            this.cacheSvc.put(['org', org.id], org, true)
                            orgs.push(
                                this.cacheSvc.get<OrgObject>(['org', org.id])
                            )
                        }
                        this.cacheSvc.put(key, orgs, false)
                        deferred.resolve(this.cacheSvc.get<OrgObject[]>(key))
                    },
                    (response: angular.IHttpResponse<OrgsResponse>) => {
                        this.apiSvc.handleErrorCallback<
                            OrgsResponse,
                            OrgObject[]
                        >(response, deferred)
                    }
                )
                .finally(() => {
                    delete this.inProgress[key]
                })
        }
        return deferred.promise
    }

    public createOrg(name: string): angular.IPromise<OrgObject> {
        const deferred: angular.IDeferred<OrgObject> = this.$q.defer()
        const url = this.uRLSvc.getOrgsURL()
        this.$http
            .post(url, {
                orgs: { name: name },
                source: 'view-editor',
            })
            .then(
                (response: angular.IHttpResponse<OrgsResponse>) => {
                    const org = response.data.orgs[0]
                    const key = ['org', org.id]
                    this.cacheSvc.put(key, response.data.orgs[0], true)
                    deferred.resolve(this.cacheSvc.get<OrgObject>(key))
                },
                (response: angular.IHttpResponse<OrgsResponse>) => {
                    this.apiSvc.handleErrorCallback(response, deferred)
                }
            )
        return deferred.promise
    }

    public getProjects(
        orgId?: string,
        ignoreCache?: boolean
    ): angular.IPromise<ProjectObject[]> {
        const deferred: angular.IDeferred<ProjectObject[]> = this.$q.defer()
        const url = this.uRLSvc.getProjectsURL(orgId)
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url] as angular.IPromise<ProjectObject[]>
        }
        const cacheKey = !orgId ? 'projects' : ['projects', orgId]
        if (this.cacheSvc.exists(cacheKey) && !ignoreCache) {
            deferred.resolve(this.cacheSvc.get<ProjectObject[]>(cacheKey))
        } else {
            this.inProgress[url] = deferred.promise
            this.$http
                .get<ProjectsResponse>(url)
                .then(
                    (response) => {
                        if (!Array.isArray(response.data.projects)) {
                            deferred.reject({
                                status: 500,
                                data: '',
                                message: 'Server Error: empty response',
                            })
                            return
                        }
                        const orgProjects: {
                            [orgId: string]: ProjectObject[]
                        } = {}
                        for (
                            let i = 0;
                            i < response.data.projects.length;
                            i++
                        ) {
                            const project = response.data.projects[i]
                            const porg = project.orgId
                            const cacheKey = this.apiSvc.makeCacheKey(
                                null,
                                project.id,
                                false,
                                'project'
                            )
                            this.cacheSvc.put(cacheKey, project, true)
                            if (orgProjects[porg] === undefined) {
                                orgProjects[porg] = []
                            }
                            orgProjects[porg].push(
                                this.cacheSvc.get<ProjectObject>(cacheKey)
                            )
                        }
                        Object.keys(orgProjects).forEach((orgId) => {
                            this.cacheSvc.put(
                                this.apiSvc.makeCacheKey(
                                    null,
                                    orgId,
                                    false,
                                    'projects'
                                ),
                                orgProjects[orgId],
                                false
                            )
                        })
                        deferred.resolve(
                            this.cacheSvc.get<ProjectObject[]>(cacheKey)
                        )
                    },
                    (response: angular.IHttpResponse<ProjectsResponse>) => {
                        this.apiSvc.handleErrorCallback(response, deferred)
                    }
                )
                .finally(() => {
                    delete this.inProgress[url]
                })
        }
        return deferred.promise
    }

    public getProject(projectId: string): angular.IPromise<ProjectObject> {
        const deferred: angular.IDeferred<ProjectObject> = this.$q.defer()
        const url = this.uRLSvc.getProjectURL(projectId)
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url] as angular.IPromise<ProjectObject>
        }
        const cacheKey = ['project', projectId]
        if (this.cacheSvc.exists(cacheKey))
            deferred.resolve(this.cacheSvc.get<ProjectObject>(cacheKey))
        else {
            this.inProgress[url] = deferred.promise
            this.$http
                .get<ProjectsResponse>(url)
                .then(
                    (response) => {
                        if (
                            !Array.isArray(response.data.projects) ||
                            response.data.projects.length === 0
                        ) {
                            deferred.reject({
                                status: 500,
                                data: '',
                                message: 'Server Error: empty response',
                            })
                            return
                        }
                        this.cacheSvc.put(
                            cacheKey,
                            response.data.projects[0],
                            true
                        )
                        deferred.resolve(
                            this.cacheSvc.get<ProjectObject>(cacheKey)
                        )
                    },
                    (response: angular.IHttpResponse<ProjectsResponse>) => {
                        this.apiSvc.handleErrorCallback(response, deferred)
                    }
                )
                .finally(() => {
                    delete this.inProgress[url]
                })
        }
        return deferred.promise
    }

    public getProjectMounts(
        projectId: string,
        refId: string,
        refresh?: boolean
    ): angular.IPromise<MountObject> {
        const deferred: angular.IDeferred<MountObject> = this.$q.defer()
        const cacheKey = this.apiSvc.makeCacheKey(
            { projectId, refId },
            '',
            false,
            'project-mounts'
        )

        this.getProject(projectId).then(
            (response: ProjectObject) => {
                const mountOb: MountObject = {
                    id: response.id,
                    _mounts: [],
                    _projectId: response.id,
                    _refId: refId,
                }
                const result: MountObject = Object.assign(response, mountOb)
                const cached: MountObject =
                    this.cacheSvc.get<MountObject>(cacheKey)
                if (this.cacheSvc.exists(cacheKey) && !refresh) {
                    result._mounts.push(...cached._mounts)
                    deferred.resolve(result)
                }
                const url = this.uRLSvc.getProjectMountsURL(projectId, refId)
                if (this.inProgress.hasOwnProperty(url)) {
                    return this.inProgress[url] as angular.IPromise<MountObject>
                } else {
                    this.inProgress[url] = deferred.promise
                    this.$http
                        .get<ProjectsResponse>(url)
                        .then(
                            (response) => {
                                if (
                                    !Array.isArray(response.data.projects) ||
                                    response.data.projects.length === 0
                                ) {
                                    deferred.reject({
                                        status: 500,
                                        data: '',
                                        message: 'Server Error: empty response',
                                    })
                                    return
                                }
                                if (response.data.projects[0]._mounts) {
                                    result._mounts = response.data.projects[0]
                                        ._mounts as MountObject[]
                                }
                                deferred.resolve(
                                    this.cacheSvc.put<MountObject>(
                                        cacheKey,
                                        result,
                                        false
                                    )
                                )
                            },
                            (
                                response: angular.IHttpResponse<ProjectsResponse>
                            ) => {
                                this.apiSvc.handleErrorCallback(
                                    response,
                                    deferred
                                )
                            }
                        )
                        .finally(() => {
                            delete this.inProgress[url]
                        })
                }
            },
            (response: VePromiseReason<ProjectObject>) => {
                this.apiSvc.handleErrorCallback(response, deferred)
            }
        )
        return deferred.promise
    }

    public getAllMountsAsArray = (project: MountObject): MountObject[] => {
        const projectsList: MountObject[] = [project]
        const mounts = project._mounts
        const getMountsArray = (
            mounts: MountObject[],
            projectsList: MountObject[]
        ) => {
            if (Array.isArray(mounts) && mounts.length !== 0) {
                for (let i = 0; i < mounts.length; i++) {
                    projectsList.push(mounts[i])
                    if (mounts[i]._mounts) {
                        getMountsArray(mounts[i]._mounts, projectsList)
                    }
                }
            }
        }
        getMountsArray(mounts, projectsList)
        return projectsList
    }

    public getRefs(projectId: string): angular.IPromise<RefObject[]> {
        const cacheKey = this.apiSvc.makeCacheKey(
            null,
            projectId,
            false,
            'refs'
        )
        const url = this.uRLSvc.getRefsURL(projectId)
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url] as angular.IPromise<RefObject[]>
        }
        const deferred: angular.IDeferred<RefObject[]> = this.$q.defer()
        if (this.cacheSvc.exists(cacheKey)) {
            deferred.resolve(this.cacheSvc.get<RefObject[]>(cacheKey))
        } else {
            this.inProgress[url] = deferred.promise
            this.$http
                .get<RefsResponse>(url)
                .then(
                    (response) => {
                        if (!Array.isArray(response.data.refs)) {
                            deferred.reject({
                                status: 500,
                                data: '',
                                message: 'Server Error: empty response',
                            })
                            return
                        }
                        const refs: RefObject[] = []
                        for (
                            let index = 0;
                            index < response.data.refs.length;
                            index++
                        ) {
                            const ref: RefObject = response.data.refs[index]
                            if (ref.id === 'master') {
                                ref.type = 'Branch'
                            }
                            const refCacheKey: string[] =
                                this.apiSvc.makeCacheKey(
                                    { projectId: projectId, refId: ref.id },
                                    '',
                                    false,
                                    'ref'
                                )
                            this.cacheSvc.put(refCacheKey, ref, true)
                            refs.push(this.cacheSvc.get<RefObject>(refCacheKey))
                        }
                        this.cacheSvc.put(cacheKey, refs, false)
                        deferred.resolve(
                            this.cacheSvc.get<RefObject[]>(cacheKey)
                        )
                    },
                    (response: angular.IHttpResponse<RefsResponse>) => {
                        this.apiSvc.handleErrorCallback(response, deferred)
                    }
                )
                .finally(() => {
                    delete this.inProgress[url]
                })
        }
        return deferred.promise
    }

    public getRef(
        refId: string,
        projectId: string
    ): angular.IPromise<RefObject> {
        const deferred: angular.IDeferred<RefObject> = this.$q.defer()
        const cacheKey = this.apiSvc.makeCacheKey(
            { projectId, refId },
            '',
            false,
            'ref'
        )
        this.getRefs(projectId).then(
            () => {
                const result = this.cacheSvc.get<RefObject>(cacheKey)
                if (result) {
                    deferred.resolve(result)
                } else {
                    deferred.reject({
                        status: 404,
                        data: '',
                        message: 'Ref not found',
                    })
                }
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    public getRefHistory(
        refId: string,
        projectId: string,
        timestamp: string
    ): angular.IPromise<CommitObject[]> {
        const deferred: angular.IDeferred<CommitObject[]> = this.$q.defer()
        let url: string
        if (timestamp !== null) {
            url = this.uRLSvc.getRefHistoryURL(projectId, refId, timestamp)
        } else {
            url = this.uRLSvc.getRefHistoryURL(projectId, refId)
        }
        this.inProgress[url] = deferred.promise
        this.$http
            .get<CommitResponse>(url)
            .then(
                (response) => {
                    if (
                        !Array.isArray(response.data.commits) ||
                        response.data.commits.length === 0
                    ) {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message:
                                'Error: Project does not exist at specified time.',
                        })
                        return
                    }
                    deferred.resolve(response.data.commits)
                },
                (response: angular.IHttpResponse<CommitResponse>) => {
                    this.apiSvc.handleErrorCallback(response, deferred)
                }
            )
            .finally(() => {
                delete this.inProgress[url]
            })
        return deferred.promise
    }

    public createRef(
        refOb: RefObject,
        projectId: string
    ): angular.IPromise<RefObject> {
        const deferred: angular.IDeferred<RefObject> = this.$q.defer()
        const url = this.uRLSvc.getRefsURL(projectId)
        const cacheKey = this.apiSvc.makeCacheKey(
            { projectId: refOb._projectId, refId: refOb.id },
            '',
            false,
            'ref'
        )
        this.$http
            .post<RefsResponse>(url, {
                refs: [refOb],
                source: 'view-editor',
            })
            .then(
                (response) => {
                    if (
                        !Array.isArray(response.data.refs) ||
                        response.data.refs.length === 0
                    ) {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        })
                        return
                    }
                    const createdRef = response.data.refs[0]
                    const list = this.cacheSvc.get<RefObject[]>(
                        this.apiSvc.makeCacheKey(
                            null,
                            projectId,
                            false,
                            'refs'
                        ),
                        true
                    )
                    if (list) {
                        list.push(createdRef)
                    }
                    this.cacheSvc.put(cacheKey, createdRef)
                    deferred.resolve(this.cacheSvc.get<RefObject>(cacheKey))
                },
                (response: angular.IHttpResponse<RefsResponse>) => {
                    this.apiSvc.handleErrorCallback(response, deferred)
                }
            )
        return deferred.promise
    }

    public updateRef(
        refOb: RequestObject,
        projectId: string
    ): angular.IPromise<RefObject> {
        const deferred: angular.IDeferred<RefObject> = this.$q.defer()
        const url = this.uRLSvc.getRefsURL(projectId)
        this.$http
            .post<RefsResponse>(url, {
                refs: [refOb],
                source: 'view-editor',
            })
            .then(
                (response) => {
                    if (
                        !Array.isArray(response.data.refs) ||
                        response.data.refs.length === 0
                    ) {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        })
                        return
                    }
                    const resp = response.data.refs[0]
                    this.cacheSvc.put(['ref', projectId, resp.id], resp, true)
                    deferred.resolve(
                        this.cacheSvc.get<RefObject>([
                            'ref',
                            projectId,
                            resp.id,
                        ])
                    )
                },
                (response: angular.IHttpResponse<RefsResponse>) => {
                    this.apiSvc.handleErrorCallback(response, deferred)
                }
            )
        return deferred.promise
    }

    public deleteRef(
        refId: string,
        projectId: string
    ): angular.IPromise<boolean> {
        const deferred: angular.IDeferred<boolean> = this.$q.defer()
        const url = this.uRLSvc.getRefURL(projectId, refId)
        this.$http.delete<RefsResponse>(url).then(
            (response) => {
                const key = this.apiSvc.makeCacheKey(
                    { refId, projectId },
                    '',
                    false,
                    'ref'
                )
                const refOb = this.cacheSvc.get<RefObject>(key)
                if (refOb) {
                    this.cacheSvc.remove(key)
                    const list = this.cacheSvc.get<RefObject[]>(
                        this.apiSvc.makeCacheKey(
                            null,
                            projectId,
                            false,
                            'refs'
                        ),
                        true
                    )
                    if (list) {
                        for (let i = 0; i < list.length; i++) {
                            if (list[i].id === refOb.id) {
                                list.splice(i, 1)
                                break
                            }
                        }
                    }
                }
                deferred.resolve(true)
            },
            (response: angular.IHttpResponse<RefsResponse>) => {
                this.apiSvc.handleErrorCallback(response, deferred)
            }
        )
        return deferred.promise
    }

    public getGroups(
        projectId: string,
        refId: string,
        ignoreCache?: boolean
    ): angular.IPromise<ElementObject[]> {
        const cacheKey = this.apiSvc.makeCacheKey(
            { projectId, refId },
            '',
            false,
            'groups'
        )
        const url = this.uRLSvc.getGroupsURL(projectId, refId)
        if (this.inProgress.hasOwnProperty(url)) {
            return this.inProgress[url] as angular.IPromise<ElementObject[]>
        }
        const deferred: angular.IDeferred<ElementObject[]> = this.$q.defer()
        if (this.cacheSvc.exists(cacheKey) && !ignoreCache) {
            deferred.resolve(this.cacheSvc.get<ElementObject[]>(cacheKey))
        } else {
            this.inProgress[url] = deferred.promise
            this.$http
                .get<GroupsResponse>(url)
                .then(
                    (response) => {
                        if (!Array.isArray(response.data.groups)) {
                            deferred.reject({
                                status: 500,
                                data: '',
                                message: 'Server Error: empty response',
                            })
                            return
                        }
                        const groups: ElementObject[] = []
                        const reqOb = {
                            projectId: projectId,
                            refId: refId,
                            commitId: 'latest',
                            elementId: '',
                        }
                        for (let i = 0; i < response.data.groups.length; i++) {
                            let group: ElementObject = response.data.groups[i]
                            reqOb.elementId = group.id
                            group = this.elementSvc.cacheElement(
                                reqOb,
                                group,
                                false
                            )
                            this.cacheSvc.put(
                                ['group', projectId, refId, group.id],
                                group,
                                true
                            )
                            groups.push(
                                this.cacheSvc.get<ElementObject>([
                                    'group',
                                    projectId,
                                    refId,
                                    group.id,
                                ])
                            )
                        }
                        const cachedGroups = this.cacheSvc.put(
                            cacheKey,
                            groups,
                            false
                        )
                        deferred.resolve(
                            this.cacheSvc.get<ElementObject[]>(cacheKey)
                        )
                    },
                    (response: angular.IHttpResponse<ElementObject[]>) => {
                        this.apiSvc.handleErrorCallback(response, deferred)
                    }
                )
                .finally(() => {
                    delete this.inProgress[url]
                })
        }
        return deferred.promise
    }

    public getGroup(
        id: string,
        projectId: string,
        refId: string
    ): angular.IPromise<ElementObject> {
        const deferred: angular.IDeferred<ElementObject> = this.$q.defer()
        this.getGroups(projectId, refId).then(
            (data) => {
                const result = this.cacheSvc.get<ElementObject>([
                    'group',
                    projectId,
                    refId,
                    id,
                ])
                if (result) {
                    deferred.resolve(result)
                } else {
                    deferred.reject({
                        status: 404,
                        data: '',
                        message: 'Group not found',
                    })
                }
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    public reset() {
        this.inProgress = {}
    }
}

veUtils.service('ProjectService', ProjectService)
