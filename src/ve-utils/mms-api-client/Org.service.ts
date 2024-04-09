import { CacheService } from '@ve-utils/core';
import { ApiService, ElementService, ProjectService, URLService } from '@ve-utils/mms-api-client';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { OrgObject, OrgsResponse } from '@ve-types/mms';

export class OrgService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'ElementService', 'ProjectService', 'URLService', 'ApiService'];
    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
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
    public getOrgs(updateCache?: boolean, includeProjects?: boolean): VePromise<OrgObject[], OrgsResponse> {
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
                                        if (includeProjects) {
                                            this.projectSvc.getProjects(org.id).then((projects) => {
                                                org.projects = projects;
                                            });
                                        }
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
