import { CacheService } from '@ve-utils/core';
import { ApiService, ElementService, URLService } from '@ve-utils/mms-api-client';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import {
    CommitObject,
    CommitResponse,
    ElementObject,
    GroupObject,
    GroupsResponse,
    MountObject,
    OrgObject,
    OrgsResponse,
    ProjectObject,
    ProjectsResponse,
    RefObject,
    RefsResponse,
} from '@ve-types/mms';

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
 * * This is a utility service for getting project, ref, commit information
 */
export class ProjectService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'ElementService', 'URLService', 'ApiService'];
    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private uRLSvc: URLService,
        private apiSvc: ApiService
    ) {
        super();
    }

    /**
     * @name ProjectService#getOrg
     * Gets org information from mms
     *
     * @param {string} orgId id of org
     * @returns {Promise} Resolves to the org object.
     */
    public getOrg(orgId: string): VePromise<OrgObject, OrgsResponse> {
        const key = ['org', orgId];
        const url = this.uRLSvc.getOrgURL(orgId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<OrgObject, OrgsResponse>((resolve, reject) => {
                    if (this.cacheSvc.exists(key)) {
                        resolve(this.cacheSvc.get<OrgObject>(key));
                        this._removeInProgress(url);
                        return;
                    } else {
                        this.$http
                            .get(url)
                            .then(
                                (response: angular.IHttpResponse<OrgsResponse>) => {
                                    if (!response.data.orgs || response.data.orgs.length < 1) {
                                        reject({
                                            status: 404,
                                            message: 'Org not found',
                                            type: 'error',
                                        });
                                    } else {
                                        this.cacheSvc.put(key, response.data.orgs[0], true);
                                        resolve(this.cacheSvc.get<OrgObject>(key));
                                    }
                                },
                                (response: angular.IHttpResponse<OrgsResponse>) =>
                                    this.apiSvc.handleErrorCallback<OrgObject>(response, reject)
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }
        return this._getInProgress<OrgObject, OrgsResponse>(url) as VePromise<OrgObject, OrgsResponse>;
    }

    /**
     * @name ProjectService#getOrgs
     * Gets orgs information
     *
     * @returns {Promise} Resolves into array of org objects.
     */
    public getOrgs(updateCache?: boolean): VePromise<OrgObject[], OrgsResponse> {
        const key = 'orgs';
        if (!this._isInProgress(key)) {
            this._addInProgress(
                key,
                new this.$q<OrgObject[], OrgsResponse>((resolve, reject) => {
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get<OrgObject[]>(key));
                        this._removeInProgress(key);
                        return;
                    } else {
                        this.$http
                            .get<OrgsResponse>(this.uRLSvc.getOrgsURL())
                            .then(
                                (response) => {
                                    const orgs: OrgObject[] = [];
                                    for (let i = 0; i < response.data.orgs.length; i++) {
                                        const org = response.data.orgs[i];
                                        this.cacheSvc.put(['org', org.id], org, true);
                                        orgs.push(this.cacheSvc.get<OrgObject>(['org', org.id]));
                                    }
                                    this.cacheSvc.put(key, orgs, false);
                                    resolve(this.cacheSvc.get<OrgObject[]>(key));
                                },
                                (response: angular.IHttpResponse<OrgsResponse>) => {
                                    this.apiSvc.handleErrorCallback(response, reject);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(key);
                            });
                    }
                })
            );
        }
        return this._getInProgress(key) as VePromise<OrgObject[], OrgsResponse>;
    }

    public createOrg(name: string): VePromise<OrgObject, OrgsResponse> {
        return new this.$q<OrgObject, OrgsResponse>((resolve, reject) => {
            const url = this.uRLSvc.getOrgsURL();
            this.$http
                .post<OrgsResponse>(url, {
                    orgs: { name: name },
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                })
                .then(
                    (response) => {
                        const org = response.data.orgs[0];
                        const key = ['org', org.id];
                        this.cacheSvc.put(key, response.data.orgs[0], true);
                        resolve(this.cacheSvc.get<OrgObject>(key));
                    },
                    (response: angular.IHttpResponse<OrgsResponse>) => {
                        this.apiSvc.handleErrorCallback(response, reject);
                    }
                );
        });
    }

    public getProjects(orgId?: string, updateCache?: boolean): VePromise<ProjectObject[], ProjectsResponse> {
        const url = this.uRLSvc.getProjectsURL(orgId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<ProjectObject[], ProjectsResponse>((resolve, reject) => {
                    const cacheKey = !orgId ? 'projects' : ['projects', orgId];
                    if (this.cacheSvc.exists(cacheKey) && !updateCache) {
                        resolve(this.cacheSvc.get<ProjectObject[]>(cacheKey));
                        this._removeInProgress(url);
                        return;
                    } else {
                        this.$http
                            .get<ProjectsResponse>(url)
                            .then(
                                (response) => {
                                    if (!Array.isArray(response.data.projects)) {
                                        reject({
                                            status: 500,
                                            message: 'Server Error: empty response',
                                            type: 'error',
                                        });
                                        return;
                                    }
                                    if (!orgId) {
                                        const orgProjects: {
                                            [orgId: string]: ProjectObject[];
                                        } = {};
                                        response.data.projects.forEach((project) => {
                                            const porg = project.orgId;
                                            const pCacheKey = this.apiSvc.makeCacheKey(
                                                null,
                                                project.id,
                                                false,
                                                'project'
                                            );

                                            if (orgProjects[porg] === undefined) {
                                                orgProjects[porg] = [];
                                            }
                                            orgProjects[porg].push(this.cacheSvc.put(pCacheKey, project, true));
                                            Object.keys(orgProjects).forEach((orgId) => {
                                                this.cacheSvc.put(
                                                    this.apiSvc.makeCacheKey(null, orgId, false, 'projects'),
                                                    orgProjects[orgId],
                                                    false
                                                );
                                            });
                                        });
                                    }
                                    resolve(this.cacheSvc.put<ProjectObject[]>(cacheKey, response.data.projects));
                                },
                                (response: angular.IHttpResponse<ProjectsResponse>) => {
                                    this.apiSvc.handleErrorCallback(response, reject);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }
        return this._getInProgress(url) as angular.IPromise<ProjectObject[]>;
    }

    public getProject(projectId: string, updateCache?: string): VePromise<ProjectObject, ProjectsResponse> {
        const url = this.uRLSvc.getProjectURL(projectId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<ProjectObject, ProjectsResponse>((resolve, reject) => {
                    const cacheKey = ['project', projectId];
                    const cached = this.cacheSvc.get<ProjectObject>(cacheKey);
                    if (cached && !updateCache) {
                        resolve(this.cacheSvc.get<ProjectObject>(cacheKey));
                        this._removeInProgress(url);
                    } else {
                        this.$http
                            .get<ProjectsResponse>(url)
                            .then(
                                (response) => {
                                    if (!Array.isArray(response.data.projects) || response.data.projects.length === 0) {
                                        reject({
                                            status: 500,
                                            message: 'Server Error: empty response',
                                            type: 'error',
                                        });
                                        return;
                                    }
                                    this.cacheSvc.put(cacheKey, response.data.projects[0], true);
                                    resolve(this.cacheSvc.get<ProjectObject>(cacheKey));
                                },
                                (response: angular.IHttpResponse<ProjectsResponse>) => {
                                    this.apiSvc.handleErrorCallback(response, reject);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }
        return this._getInProgress(url) as angular.IPromise<ProjectObject>;
    }

    public getProjectMounts(
        projectId: string,
        refId: string,
        updateCache?: boolean
    ): VePromise<MountObject, ProjectsResponse> {
        const url = this.uRLSvc.getProjectMountsURL(projectId, refId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<MountObject, ProjectsResponse>((resolve, reject) => {
                    const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '', false, 'project-mounts');

                    this.getProject(projectId).then(
                        (response: ProjectObject) => {
                            const mountOb: MountObject = {
                                id: response.id,
                                _mounts: [],
                                _projectId: response.id,
                                _refId: refId,
                            };
                            const result: MountObject = Object.assign(mountOb, response);
                            const cached: MountObject = this.cacheSvc.get<MountObject>(cacheKey);
                            if (this.cacheSvc.exists(cacheKey) && !updateCache) {
                                result._mounts.push(...cached._mounts);
                                resolve(result);
                                this._removeInProgress(url);
                                return;
                            } else {
                                this.$http
                                    .get<ProjectsResponse>(url)
                                    .then(
                                        (response) => {
                                            if (
                                                !Array.isArray(response.data.projects) ||
                                                response.data.projects.length === 0
                                            ) {
                                                reject({
                                                    status: 500,
                                                    message: 'Server Error: empty response',
                                                    type: 'error',
                                                });
                                                return;
                                            }
                                            if (response.data.projects[0]._mounts) {
                                                result._mounts = (response.data.projects[0] as MountObject)._mounts;
                                            }
                                            resolve(this.cacheSvc.put<MountObject>(cacheKey, result, false));
                                        },
                                        (response: angular.IHttpResponse<ProjectsResponse>) => {
                                            this.apiSvc.handleErrorCallback(response, reject);
                                        }
                                    )
                                    .finally(() => {
                                        this._removeInProgress(url);
                                    });
                            }
                        },
                        (response) => {
                            reject(response);
                            this._removeInProgress(url);
                        }
                    );
                })
            );
        }
        return this._getInProgress(url) as VePromise<MountObject, ProjectsResponse>;
    }

    public getAllMountsAsArray = (project: MountObject): MountObject[] => {
        const projectsList: MountObject[] = [project];
        const mounts = project._mounts;
        const getMountsArray = (mounts: MountObject[], projectsList: MountObject[]): void => {
            if (Array.isArray(mounts) && mounts.length !== 0) {
                for (let i = 0; i < mounts.length; i++) {
                    projectsList.push(mounts[i]);
                    if (mounts[i]._mounts) {
                        getMountsArray(mounts[i]._mounts, projectsList);
                    }
                }
            }
        };
        getMountsArray(mounts, projectsList);
        return projectsList;
    };

    public getRefs(projectId: string): VePromise<RefObject[], RefsResponse> {
        const cacheKey = this.apiSvc.makeCacheKey(null, projectId, false, 'refs');
        const url = this.uRLSvc.getRefsURL(projectId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<RefObject[], RefsResponse>((resolve, reject) => {
                    if (this.cacheSvc.exists(cacheKey)) {
                        resolve(this.cacheSvc.get<RefObject[]>(cacheKey));
                        this._removeInProgress(url);
                        return;
                    } else {
                        this.$http
                            .get<RefsResponse>(url)
                            .then(
                                (response) => {
                                    if (!Array.isArray(response.data.refs)) {
                                        reject({
                                            status: 500,

                                            message: 'Server Error: empty response',
                                        });
                                        return;
                                    }
                                    const refs: RefObject[] = [];
                                    for (let index = 0; index < response.data.refs.length; index++) {
                                        const ref: RefObject = response.data.refs[index];
                                        if (ref.id === 'master') {
                                            ref.type = 'Branch';
                                        }
                                        const refCacheKey: string[] = this.apiSvc.makeCacheKey(
                                            { projectId: projectId, refId: ref.id },
                                            '',
                                            false,
                                            'ref'
                                        );
                                        this.cacheSvc.put(refCacheKey, ref, true);
                                        refs.push(this.cacheSvc.get<RefObject>(refCacheKey));
                                    }
                                    this.cacheSvc.put(cacheKey, refs, false);
                                    resolve(this.cacheSvc.get<RefObject[]>(cacheKey));
                                },
                                (response: angular.IHttpResponse<RefsResponse>) => {
                                    this.apiSvc.handleErrorCallback(response, reject);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }
        return this._getInProgress(url) as VePromise<RefObject[], RefsResponse>;
    }

    public getRef(refId: string, projectId: string, updateCache?: boolean): VePromise<RefObject, RefsResponse> {
        const url = this.uRLSvc.getRefURL(projectId, refId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<RefObject, RefsResponse>((resolve, reject) => {
                    const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '', false, 'ref');
                    const cached = this.cacheSvc.get<RefObject>(cacheKey);
                    if (cached && !updateCache) {
                        this._removeInProgress(url);
                        resolve(cached);
                    } else {
                        this.$http
                            .get<RefsResponse>(url)
                            .then(
                                (response) => {
                                    this.cacheSvc.put<RefObject>(cacheKey, response.data.refs[0]);
                                    resolve(this.cacheSvc.get<RefObject>(cacheKey));
                                },
                                (response: angular.IHttpResponse<RefsResponse>) => {
                                    this.apiSvc.handleErrorCallback(response, reject);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }

        return this._getInProgress(url) as VePromise<RefObject, RefsResponse>;
    }

    public getCommits(
        refId: string,
        projectId: string,
        timestamp?: string,
        limit?: number
    ): VePromise<CommitObject[], CommitResponse> {
        let url: string;
        if (timestamp !== null) {
            url = this.uRLSvc.getCommitsURL(projectId, refId, timestamp, limit);
        } else {
            url = this.uRLSvc.getCommitsURL(projectId, refId, null, limit);
        }
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<CommitObject[], CommitResponse>((resolve, reject) => {
                    this.$http
                        .get<CommitResponse>(url)
                        .then(
                            (response) => {
                                if (!Array.isArray(response.data.commits) || response.data.commits.length === 0) {
                                    reject({
                                        status: 500,

                                        message: 'Project does not exist at specified time.',
                                        type: 'error',
                                    });
                                    return;
                                }
                                resolve(response.data.commits);
                            },
                            (response: angular.IHttpResponse<CommitResponse>) => {
                                this.apiSvc.handleErrorCallback(response, reject);
                            }
                        )
                        .finally(() => {
                            this._removeInProgress(url);
                        });
                })
            );
        }
        return this._getInProgress(url) as VePromise<CommitObject[], CommitResponse>;
    }

    public getCommit(projectId: string, refId: string, commitId: string): VePromise<CommitObject, CommitResponse> {
        const url = this.uRLSvc.getCommitUrl(projectId, refId, commitId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<CommitObject, CommitResponse>((resolve, reject) => {
                    const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId, commitId }, '', false, 'commit');
                    if (this.cacheSvc.exists(cacheKey)) {
                        resolve(this.cacheSvc.get<CommitObject>(cacheKey));
                    } else {
                        this.$http
                            .get<CommitResponse>(url)
                            .then(
                                (response) => {
                                    resolve(this.cacheSvc.put(cacheKey, response.data.commits[0]));
                                },
                                (response: angular.IHttpResponse<CommitResponse>) => {
                                    this.apiSvc.handleErrorCallback(response, reject);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }
        return this._getInProgress(url) as VePromise<CommitObject, CommitResponse>;
    }

    public createRef(refOb: RefObject, projectId: string): VePromise<RefObject, RefsResponse> {
        return new this.$q<RefObject, RefsResponse>((resolve, reject) => {
            const url = this.uRLSvc.getRefsURL(projectId);
            const cacheKey = this.apiSvc.makeCacheKey(
                { projectId: refOb._projectId, refId: refOb.id },
                '',
                false,
                'ref'
            );
            this.$http
                .post<RefsResponse>(url, {
                    refs: [refOb],
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                })
                .then(
                    (response) => {
                        if (!Array.isArray(response.data.refs) || response.data.refs.length === 0) {
                            reject({
                                status: 500,

                                message: 'Server Error: empty response',
                                type: 'error',
                            });
                            return;
                        }
                        const createdRef = response.data.refs[0];
                        const list = this.cacheSvc.get<RefObject[]>(
                            this.apiSvc.makeCacheKey(null, projectId, false, 'refs'),
                            true
                        );
                        if (list) {
                            list.push(createdRef);
                        }
                        this.cacheSvc.put(cacheKey, createdRef);
                        resolve(this.cacheSvc.get<RefObject>(cacheKey));
                    },
                    (response: angular.IHttpResponse<RefsResponse>) => {
                        this.apiSvc.handleErrorCallback(response, reject);
                    }
                );
        });
    }

    public updateRef(refOb: RefObject, projectId: string): VePromise<RefObject, RefsResponse> {
        return new this.$q<RefObject, RefsResponse>((resolve, reject) => {
            const url = this.uRLSvc.getRefsURL(projectId);
            this.$http
                .post<RefsResponse>(url, {
                    refs: [refOb],
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                })
                .then(
                    (response) => {
                        if (!Array.isArray(response.data.refs) || response.data.refs.length === 0) {
                            reject({
                                status: 500,

                                message: 'Server Error: empty response',
                                type: 'error',
                            });
                            return;
                        }
                        const resp = response.data.refs[0];
                        this.cacheSvc.put(['ref', projectId, resp.id], resp, true);
                        resolve(this.cacheSvc.get<RefObject>(['ref', projectId, resp.id]));
                    },
                    (response: angular.IHttpResponse<RefsResponse>) => {
                        this.apiSvc.handleErrorCallback(response, reject);
                    }
                );
        });
    }

    public deleteRef(refId: string, projectId: string): VePromise<void, RefsResponse> {
        return new this.$q<void, RefsResponse>((resolve, reject) => {
            const url = this.uRLSvc.getRefURL(projectId, refId);
            this.$http.delete<RefsResponse>(url).then(
                (response) => {
                    const key = this.apiSvc.makeCacheKey({ refId, projectId }, '', false, 'ref');
                    const refOb = this.cacheSvc.get<RefObject>(key);
                    if (refOb) {
                        this.cacheSvc.remove(key);
                        const list = this.cacheSvc.get<RefObject[]>(
                            this.apiSvc.makeCacheKey(null, projectId, false, 'refs'),
                            true
                        );
                        if (list) {
                            for (let i = 0; i < list.length; i++) {
                                if (list[i].id === refOb.id) {
                                    list.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    }
                    resolve();
                },
                (response: angular.IHttpResponse<RefsResponse>) => {
                    this.apiSvc.handleErrorCallback(response, reject);
                }
            );
        });
    }

    public getGroups(
        projectId: string,
        refId: string,
        updateCache?: boolean
    ): VePromise<GroupObject[], GroupsResponse> {
        const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '', false, 'groups');
        const url = this.uRLSvc.getGroupsURL(projectId, refId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<GroupObject[], GroupsResponse>((resolve, reject) => {
                    if (this.cacheSvc.exists(cacheKey) && !updateCache) {
                        resolve(this.cacheSvc.get<GroupObject[]>(cacheKey));
                    } else {
                        this.$http
                            .get<GroupsResponse>(url)
                            .then(
                                (response) => {
                                    if (!Array.isArray(response.data.groups)) {
                                        reject({
                                            status: 500,

                                            message: 'Server Error: empty response',
                                            type: 'error',
                                        });
                                        return;
                                    }
                                    const groups: GroupObject[] = [];
                                    const reqOb = {
                                        projectId: projectId,
                                        refId: refId,
                                        commitId: 'latest',
                                        elementId: '',
                                    };
                                    for (let i = 0; i < response.data.groups.length; i++) {
                                        let group: GroupObject = response.data.groups[i];
                                        reqOb.elementId = group.id;
                                        group = this.elementSvc.cacheElement(reqOb, group);
                                        this.cacheSvc.put(['group', projectId, refId, group.id], group, true);
                                        groups.push(
                                            this.cacheSvc.get<GroupObject>(['group', projectId, refId, group.id])
                                        );
                                    }
                                    this.cacheSvc.put(cacheKey, groups, false);
                                    resolve(this.cacheSvc.get<GroupObject[]>(cacheKey));
                                },
                                (response: angular.IHttpResponse<GroupsResponse>) => {
                                    this.apiSvc.handleErrorCallback(response, reject);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }
        return this._getInProgress(url) as VePromise<GroupObject[], GroupsResponse>;
    }

    public getGroup(id: string, projectId: string, refId: string): VePromise<GroupObject, GroupsResponse> {
        return new this.$q<GroupObject, GroupsResponse>((resolve, reject) => {
            this.getGroups(projectId, refId).then(
                (data) => {
                    const result = this.cacheSvc.get<ElementObject>(['group', projectId, refId, id]);
                    if (result) {
                        resolve(result);
                    } else {
                        reject({
                            status: 404,

                            message: 'Group not found',
                            type: 'error',
                        });
                    }
                },
                (reason) => {
                    reject(reason);
                }
            );
        });
    }
}

veUtils.service('ProjectService', ProjectService);
