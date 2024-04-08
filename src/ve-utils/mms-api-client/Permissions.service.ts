import { ApiService, URLService, UserService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { PermissionsLookupResponse, PermissionsLookupObject, UsersResponse, PermissionsResponse, PermissionsObject, AdminObject } from '@ve-types/mms';
import { CacheService } from '@ve-utils/core';

export interface PermissionCache {
    org: { [id: string]: string };
    project: { [id: string]: string };
    ref: { [id: string]: string };
}

/**
 * @ngdoc service
 * @name PermissionsService
 *
 * @requires $q
 * @requires $http
 * @requires URLService
 * * This utility service handles permissions inquiries
 */
export class PermissionsService {
    private permissions: PermissionCache = { org: {}, project: {}, ref: {} };

    private permissionsMap = {
        project: {
            read: "PROJECT_READ",
            write: "PROJECT_EDIT",
            admin: "PROJECT_UPDATE_PERMISSIONS"
        },
        org: {
            read: "ORG_READ",
            write: "ORG_EDIT",
            admin: "ORG_UPDATE_PERMISSIONS"
        },
        branch: {
            read: "BRANCH_READ",
            write: "BRANCH_EDIT_CONTENT",
            admin: "BRANCH_UPDATE_PERMISSIONS"
        }
    }

    static $inject = ['$q', '$http', 'URLService', 'ApiService', 'UserService', 'CacheService'];

    constructor(private $q: VeQService, private $http: angular.IHttpService, private uRLSvc: URLService, private apiSvc: ApiService, private userSvc: UserService, private cacheSvc: CacheService) {}


    public lookupPermissions(lookups: PermissionsLookupObject[]): VePromise<PermissionsLookupObject[], PermissionsLookupResponse> {
        const url = this.uRLSvc.getPermissionsLookupURL();
        return new this.$q((resolve,reject) => {
        this.$http
            .put<PermissionsLookupResponse>(url, {
                lookups: lookups,
            })
            .then(
                (response) => {
                    const data: PermissionsLookupObject[] = response.data.lookups;
                    if (Array.isArray(data) && data.length > 0) {
                        resolve(data);
                    } else {
                        reject({
                            status: 500,
                            data: response.data,
                            message: 'Server Error: empty response',
                        });
                    }
                },
                (response: angular.IHttpResponse<PermissionsLookupResponse>) => {
                    reject(this.uRLSvc.handleHttpStatus(response));
                }
            );

        })
    }

    public getProjectPermissions(projectId: string, updateCache?: boolean): VePromise<PermissionsObject, PermissionsResponse> {
        const url = this.uRLSvc.getProjectPermissionsURL(projectId);
        return new this.$q((resolve,reject) => {
            const cacheKey = this.apiSvc.makeCacheKey(null, projectId, false, 'permissions')
            if (this.cacheSvc.exists(cacheKey) && !updateCache) {
                resolve(this.cacheSvc.get<PermissionsObject>(cacheKey));
                return;
            } else {
                this.$http.get<PermissionsResponse>(url).then(
                    (response) => {
                        resolve(this.cacheSvc.put<PermissionsObject>(cacheKey, response.data))
                    }
                ),
                (response: angular.IHttpResponse<PermissionsResponse>) => {
                    reject(this.uRLSvc.handleHttpStatus(response));
                }
            }
        })
    }

    public getRefPermissions(projectId: string, refId: string, updateCache?: boolean): VePromise<PermissionsObject, PermissionsResponse> {
        const url = this.uRLSvc.getRefPermissionsURL(projectId, refId);
        return new this.$q((resolve,reject) => {
            const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '', false, 'permissions');
            if (this.cacheSvc.exists(cacheKey) && !updateCache) {
                resolve(this.cacheSvc.get<PermissionsObject>(cacheKey));
                return;
            } else {
                this.$http.get<PermissionsResponse>(url).then(
                    (response) => {
                        resolve(this.cacheSvc.put<PermissionsObject>(cacheKey, response.data))
                    }
                ),
                (response: angular.IHttpResponse<PermissionsResponse>) => {
                    reject(this.uRLSvc.handleHttpStatus(response));
                }
            }
        })
    }

    public getOrgPermissions(orgId: string, updateCache?: boolean): VePromise<PermissionsObject, PermissionsResponse> {
        const url = this.uRLSvc.getOrgPermissionsURL(orgId);
        return new this.$q((resolve,reject) => {
            const cacheKey = this.apiSvc.makeCacheKey(null, orgId, false, 'permissions');
            if (this.cacheSvc.exists(cacheKey) && !updateCache) {
                resolve(this.cacheSvc.get<PermissionsObject>(cacheKey));
                return;
            } else {
                this.$http.get<PermissionsResponse>(url).then(
                    (response) => {
                        resolve(this.cacheSvc.put<PermissionsObject>(cacheKey, response.data))
                    }
                ),
                (response: angular.IHttpResponse<PermissionsResponse>) => {
                    reject(this.uRLSvc.handleHttpStatus(response));
                }
            }
        })
    }

    public getProjectPermission(projectId: string): VePromise<AdminObject, PermissionsLookupResponse> {
        const type: string = 'project'
        const lookups: PermissionsLookupObject[] = [
            {
                type: type.toUpperCase(),
                projectId: projectId,
                privilege: this.permissions[type].read
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                privilege: this.permissions[type].edit
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                privilege: this.permissions[type].admin
            }
        ]
        return new this.$q((resolve, reject) => {
            const cacheKey = this.apiSvc.makeCacheKey(null, projectId, false, 'permission')
            if (this.cacheSvc.exists(cacheKey)) {
                resolve(this.cacheSvc.get<AdminObject>(cacheKey));
                return;
            } else {
                this.lookupPermissions(lookups).then((response) => {
                    let permission: number = 0
                    response.forEach((lookup) => {
                        switch (lookup.privilege) {
                            case this.permissions[type].read:
                                permission = permission + 4
                                break;
                            case this.permissions[type].edit:
                                permission = permission + 2
                                break;
                            case this.permissions[type].admin:
                                permission = permission + 1
                                break;
                        }
                    })
                    resolve(this.cacheSvc.put<AdminObject>(cacheKey, { id: projectId, permission: permission == 7 ? "admin" : permission == 6 ? "write" : "read" }))
                }, reject)
            }
        })
    }

    public getOrgPermission(orgId: string): VePromise<AdminObject, PermissionsLookupResponse> {
        const type: string = 'org'
        const lookups: PermissionsLookupObject[] = [
            {
                type: type.toUpperCase(),
                orgId: orgId,
                privilege: this.permissions[type].read
            },
            {
                type: type.toUpperCase(),
                orgId: orgId,
                privilege: this.permissions[type].edit
            },
            {
                type: type.toUpperCase(),
                orgId: orgId,
                privilege: this.permissions[type].admin
            }
        ]
        return new this.$q((resolve, reject) => {
            const cacheKey = this.apiSvc.makeCacheKey(null, orgId, false, 'permission')
            if (this.cacheSvc.exists(cacheKey)) {
                resolve(this.cacheSvc.get<AdminObject>(cacheKey));
                return;
            } else {
                this.lookupPermissions(lookups).then((response) => {
                    let permission: number = 0
                    response.forEach((lookup) => {
                        switch (lookup.privilege) {
                            case this.permissions[type].read:
                                permission = permission + 4
                                break;
                            case this.permissions[type].edit:
                                permission = permission + 2
                                break;
                            case this.permissions[type].admin:
                                permission = permission + 1
                                break;
                        }
                    })
                    resolve(this.cacheSvc.put<AdminObject>(cacheKey, { id: orgId, permission: permission == 7 ? "admin" : permission == 6 ? "write" : "read" }))
                }, reject)
            }
        })
    }

    public getRefPermission(projectId: string, refId: string): VePromise<AdminObject, PermissionsLookupResponse> {
        const type: string = 'branch'
        const lookups: PermissionsLookupObject[] = [
            {
                type: type.toUpperCase(),
                projectId: projectId,
                refId: refId,
                privilege: this.permissions[type].read
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                refId: refId,
                privilege: this.permissions[type].edit
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                refId: refId,
                privilege: this.permissions[type].admin
            }
        ]
        return new this.$q((resolve, reject) => {
            const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '', false, 'permission')
            if (this.cacheSvc.exists(cacheKey)) {
                resolve(this.cacheSvc.get<AdminObject>(cacheKey));
                return;
            } else {
                this.lookupPermissions(lookups).then((response) => {
                    let permission: number = 0
                    response.forEach((lookup) => {
                        switch (lookup.privilege) {
                            case this.permissions[type].read:
                                permission = permission + 4
                                break;
                            case this.permissions[type].edit:
                                permission = permission + 2
                                break;
                            case this.permissions[type].admin:
                                permission = permission + 1
                                break;
                        }
                    })
                    resolve(this.cacheSvc.put<AdminObject>(cacheKey, { id: projectId, permission: permission == 7 ? "admin" : permission == 6 ? "write" : "read" }))
                }, reject)
            }
        })
    }

    public initializePermissions(orgId: string, projectId: string, refId?: string): VePromise<PermissionCache, PermissionsLookupResponse> {
        return new this.$q((resolve,reject) => {
            let promises: VePromise<void, PermissionsLookupResponse>[] = []
            promises.push(this.getOrgPermission(orgId).then((result) => {
                this.permissions.org[orgId] = result.permission
            },reject))

            if (projectId) {
                promises.push(this.getProjectPermission(projectId).then((result) => {
                    this.permissions.project[projectId] = result.permission
                },reject))
            }

            if (refId) {
                promises.push(this.getRefPermission(projectId, refId).then((result) => {
                    this.permissions.ref[projectId + '/' + refId] = result.permission
                },reject))
            }


            this.$q.all(promises).finally(() => {
                resolve(this.permissions)
            })
        })
    }

    public hasOrgEditPermission = (orgId: string): boolean => {
        return this.permissions.org[orgId] == "edit" || this.permissions.org[orgId] == "admin";
    };

    public hasProjectEditPermission = (projectId: string): boolean => {
        return this.permissions.project[projectId] == "edit" || this.permissions.project[projectId] == "admin";
    };

    public hasBranchEditPermission = (projectId: string, refId: string): boolean => {
        return this.permissions.ref[projectId + '/' + refId] == "edit" || this.permissions.ref[projectId + '/' + refId] == "admin";
    };

    public hasAdminPermission = (username: string): VePromise<boolean, UsersResponse> => {
        return new this.$q((resolve,reject) => {
            this.userSvc.getUserData(username).then((user) => {
                resolve(user.admin)
            },(reason) => {
                reject(reason)
            })
        
        })
    };
}

veUtils.service('PermissionsService', PermissionsService);
