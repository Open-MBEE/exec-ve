import { CacheService } from '@ve-utils/core';
import { ApiService, PermissionService, ProjectService, URLService } from '@ve-utils/mms-api-client';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';

import { veUtils } from '@ve-utils';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import {
    BasicResponse,
    MmsObject,
    OrgObject,
    OrgsResponse,
    OrgsUpdateRequest,
    ProjectObject,
    ProjectsResponse,
} from '@ve-types/mms';

export class OrgService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'ProjectService', 'URLService', 'ApiService', 'PermissionService'];
    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private cacheSvc: CacheService,
        private projectSvc: ProjectService,
        private uRLSvc: URLService,
        private apiSvc: ApiService,
        private permissionSvc: PermissionService
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
    public getOrg(orgId: string, updateCache?: boolean): VePromise<OrgObject, OrgsResponse> {
        const key = ['org', orgId];
        const url = this.uRLSvc.getOrgURL(orgId);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<OrgObject, OrgsResponse>((resolve, reject) => {
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get<OrgObject>(key));
                        this._removeInProgress(url);
                        return;
                    } else {
                        this.$http
                            .get(url)
                            .then(
                                (response: VeHttpResponse<OrgsResponse>) => {
                                    if (!response.data.orgs || response.data.orgs.length < 1) {
                                        reject({
                                            status: 404,
                                            message: 'Org not found',
                                            type: 'error',
                                        });
                                    } else {
                                        const org: OrgObject = response.data.orgs[0];
                                        const promises: VePromise<MmsObject, BasicResponse<MmsObject>>[] = [];
                                        const perms = this.permissionSvc.getOrgPermission(org.id);
                                        perms.then((perms) => {
                                            org.permission = perms;
                                        }, reject);
                                        const projects = this.projectSvc.getProjects(org.id);
                                        projects.then((projs) => {
                                            org.projects = projs;
                                        }, reject);
                                        const all = this.$q.all([perms, projects]);
                                        promises.push(all);
                                        all.finally(() => {
                                            resolve(this.cacheSvc.put(key, org, false));
                                        });
                                    }
                                },
                                (response: VeHttpResponse<OrgsResponse>) =>
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
                                    const orgs: OrgObject[] = response.data.orgs;
                                    const promises: VePromise<MmsObject, BasicResponse<MmsObject>>[] = [];
                                    orgs.forEach((org) => {
                                        const perms = this.permissionSvc.getOrgPermission(org.id);
                                        perms.then((perms) => {
                                            org.permission = perms;
                                        }, reject);
                                        const projects = this.projectSvc.getProjects(org.id);
                                        projects.then((projs) => {
                                            org.projects = projs;
                                        }, reject);
                                        const all = this.$q.all([perms, projects]);
                                        promises.push(all);
                                        all.finally(() => {
                                            this.cacheSvc.put(['org', org.id], org, false);
                                        });
                                    });
                                    this.$q.all(promises).finally(() => {
                                        resolve(this.cacheSvc.put(key, orgs, false));
                                    });
                                },
                                (response: VeHttpResponse<OrgsResponse>) => {
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

    public getOrgHome(orgId: string, updateCache?: boolean): VePromise<ProjectObject, ProjectsResponse> {
        return new this.$q((resolve, reject) => {
            this.projectSvc.getProject(`${orgId}-home`, updateCache).then(resolve, (reason) => {
                if (reason.status == 404) {
                    this.getOrg(orgId, updateCache).then((org) => {
                        const reqOb: ProjectObject = {
                            id: `${orgId}-home`,
                            orgId: orgId,
                            name: `${org.name ? org.name : org.id} Home`,
                            public: false,
                        };
                        this.projectSvc.createProject(reqOb).then(resolve, reject);
                    }, reject);
                } else {
                    reject(reason);
                }
            });
        });
    }

    public createOrg(orgObj: OrgObject): VePromise<OrgObject, OrgsResponse> {
        return new this.$q<OrgObject, OrgsResponse>((resolve, reject) => {
            const url = this.uRLSvc.getOrgsURL();
            const orgs: OrgObject[] = [];
            orgs.push(orgObj);
            this.$http
                .post<OrgsResponse, OrgsUpdateRequest>(url, {
                    orgs: orgs,
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                })
                .then(
                    (response) => {
                        const org = response.data.orgs[0];
                        const key = ['org', org.id];
                        this.cacheSvc.put(key, response.data.orgs[0], true);
                        resolve(this.cacheSvc.get<OrgObject>(key));
                    },
                    (response: VeHttpResponse<OrgsResponse>) => {
                        this.apiSvc.handleErrorCallback(response, reject);
                    }
                );
        });
    }
}

veUtils.service('OrgService', OrgService);
