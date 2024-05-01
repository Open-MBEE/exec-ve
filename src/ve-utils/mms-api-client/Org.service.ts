import { CacheService } from '@ve-utils/core';
import { ApiService, PermissionService, ProjectService, URLService } from '@ve-utils/mms-api-client';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { BasicResponse, MmsObject, OrgObject, OrgsResponse } from '@ve-types/mms';

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
                                (response: angular.IHttpResponse<OrgsResponse>) => {
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

    // public getOrgsProjects(updateCache?: boolean): VePromise<OrgObject[], OrgsResponse | ProjectsResponse> {
    //     const key = 'orgs';
    //     return new this.$q((resolve, reject) => {
    //         this.getOrgs(updateCache).then((orgs) => {
    //             const promises: VePromise<ProjectObject[], ProjectsResponse>[] = [];
    //             if (!orgs[0].projects && !updateCache) {
    //                 orgs.forEach((org) => {
    //                     const promise = this.projectSvc.getProjects(org.id);
    //                     promises.push(promise);
    //                     promise.then(
    //                         (projs) => {
    //                             org.projects = projs;
    //                             this.cacheSvc.put(['org', org.id], org, true);
    //                         },
    //                         () => {
    //                             org.projects = [];
    //                         }
    //                     );
    //                 });
    //                 this.$q.all(promises).finally(() => {
    //                     resolve(this.cacheSvc.put(key, orgs, true));
    //                 });
    //             } else {
    //                 resolve(this.cacheSvc.get(key));
    //             }
    //         }, reject);
    //     });
    // }

    // public getOrgsPermission(updateCache?: boolean): VePromise<OrgObject[], OrgsResponse | PermissionResponse> {
    //     const key = 'orgs';
    //     return new this.$q((resolve, reject) => {
    //         this.getOrgs(updateCache).then((orgs) => {
    //             if (!orgs[0].permission && !updateCache) {
    //                 const promises: VePromise<PermissionMap, PermissionResponse>[] = [];
    //                 orgs.forEach((org) => {
    //                     const promise = this.permissionSvc.getOrgPermission(org.id);
    //                     promises.push(promise);
    //                     promise.then(
    //                         (perms) => {
    //                             org.permissons = perms;
    //                             this.cacheSvc.put(['org', org.id], org, true);
    //                         },
    //                         () => {
    //                             org.permission = { users: {}, groups: {} };
    //                         }
    //                     );
    //                 });
    //                 this.$q.all(promises).finally(() => {
    //                     resolve(this.cacheSvc.put(key, orgs, true));
    //                 });
    //             } else {
    //                 resolve(this.cacheSvc.get(key));
    //             }
    //         }, reject);
    //     });
    // }

    public createOrg(orgObj: OrgObject): VePromise<OrgObject, OrgsResponse> {
        return new this.$q<OrgObject, OrgsResponse>((resolve, reject) => {
            const url = this.uRLSvc.getOrgsURL();
            this.$http
                .post<OrgsResponse>(url, {
                    orgs: orgObj,
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
}

veUtils.service('OrgService', OrgService);
