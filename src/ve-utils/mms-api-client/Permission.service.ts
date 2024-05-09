import { CacheService } from '@ve-utils/core';
import { ApiService, URLService, UserService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import {
    PermissionLookupObject,
    PermissionLookupResponse,
    PermissionMap,
    PermissionResponse,
    PermissionUpdateRequest,
    PermissionUpdateResponse,
    UsersResponse,
} from '@ve-types/mms';
import Role, { VeRole } from '@ve-types/mms/permissions';

export interface PermissionCache {
    org: { [id: string]: VeRole['ANY'] };
    project: { [id: string]: VeRole['ANY'] };
    ref: { [id: string]: VeRole['ANY'] };
}

/**
 * @ngdoc service
 * @name PermissionService
 *
 * @requires $q
 * @requires $http
 * @requires URLService
 * * This utility service handles permission inquiries
 */
export class PermissionService {
    private permission: PermissionCache = { org: {}, project: {}, ref: {} };

    private permissionLookup: {
        [type: string]: {
            read: string;
            write: string;
            admin: string;
        };
    } = {
        project: {
            read: 'PROJECT_READ',
            write: 'PROJECT_EDIT',
            admin: 'PROJECT_UPDATE_PERMISSION',
        },
        org: {
            read: 'ORG_READ',
            write: 'ORG_EDIT',
            admin: 'ORG_UPDATE_PERMISSION',
        },
        branch: {
            read: 'BRANCH_READ',
            write: 'BRANCH_EDIT_CONTENT',
            admin: 'BRANCH_UPDATE_PERMISSION',
        },
    };

    static $inject = ['$q', '$http', 'URLService', 'ApiService', 'UserService', 'CacheService'];

    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private uRLSvc: URLService,
        private apiSvc: ApiService,
        private userSvc: UserService,
        private cacheSvc: CacheService
    ) {}

    public lookupPermission(
        type: string,
        lookups: PermissionLookupObject[]
    ): VePromise<string, PermissionLookupResponse> {
        const url = this.uRLSvc.getPermissionLookupURL();
        return new this.$q((resolve, reject) => {
            this.$http
                .put<PermissionLookupResponse>(url, {
                    lookups: lookups,
                })
                .then(
                    (response) => {
                        const data: PermissionLookupObject[] = response.data.lookups;
                        if (Array.isArray(data) && data.length > 0) {
                            let permission = 0;
                            data.forEach((lookup) => {
                                switch (lookup.privilege) {
                                    case this.permissionLookup[type].read:
                                        permission = permission + 4;
                                        break;
                                    case this.permissionLookup[type].write:
                                        permission = permission + 2;
                                        break;
                                    case this.permissionLookup[type].admin:
                                        permission = permission + 1;
                                        break;
                                }
                            });
                        } else {
                            reject({
                                status: 500,
                                data: response.data,
                                message: 'Server Error: empty response',
                            });
                        }
                    },
                    (response: VeHttpResponse<PermissionLookupResponse>) => {
                        reject(this.uRLSvc.handleHttpStatus(response));
                    }
                );
        });
    }

    public getProjectPermission(
        projectId: string,
        updateCache?: boolean
    ): VePromise<PermissionMap, PermissionResponse> {
        const url = this.uRLSvc.getProjectPermissionURL(projectId);
        const cacheKey = this.apiSvc.makeCacheKey(null, projectId, false, 'permission');
        return this.getPermission(url, cacheKey, updateCache);
    }

    public getRefPermission(
        projectId: string,
        refId: string,
        updateCache?: boolean
    ): VePromise<PermissionMap, PermissionResponse> {
        const url = this.uRLSvc.getRefPermissionURL(projectId, refId);
        const cacheKey = this.apiSvc.makeCacheKey({ projectId, refId }, '', false, 'permission');
        return this.getPermission(url, cacheKey, updateCache);
    }

    public getOrgPermission(orgId: string, updateCache?: boolean): VePromise<PermissionMap, PermissionResponse> {
        const url = this.uRLSvc.getOrgPermissionURL(orgId);
        const cacheKey = this.apiSvc.makeCacheKey(null, orgId, false, 'permission');
        return this.getPermission(url, cacheKey, updateCache);
    }

    public getPermission(
        url: string,
        cacheKey: string[],
        updateCache?: boolean
    ): VePromise<PermissionMap, PermissionResponse> {
        return new this.$q((resolve, reject) => {
            if (this.cacheSvc.exists(cacheKey) && !updateCache) {
                resolve(this.cacheSvc.get<PermissionMap>(cacheKey));
                return;
            } else {
                this.$http.get<PermissionResponse>(url).then(
                    (response) => {
                        const perms: PermissionMap = {
                            users: {},
                            groups: {},
                        };
                        response.data.users.permissions.forEach((perm) => {
                            perms.users[perm.name] = perm;
                        });
                        response.data.groups.permissions.forEach((perm) => {
                            perms.groups[perm.name] = perm;
                        });
                        resolve(this.cacheSvc.put<PermissionMap>(cacheKey, perms));
                    },
                    (response: VeHttpResponse<PermissionResponse>) => {
                        reject(this.uRLSvc.handleHttpStatus(response));
                    }
                );
            }
        });
    }

    public lookupProjectPermission(projectId: string): VePromise<string, PermissionLookupResponse> {
        const type = 'project';
        const lookups: PermissionLookupObject[] = [
            {
                type: type.toUpperCase(),
                projectId: projectId,
                privilege: this.permissionLookup[type].read,
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                privilege: this.permissionLookup[type].write,
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                privilege: this.permissionLookup[type].admin,
            },
        ];
        return this.lookupPermission(type, lookups);
    }

    public lookupOrgPermission(orgId: string): VePromise<string, PermissionLookupResponse> {
        const type = 'org';
        const lookups: PermissionLookupObject[] = [
            {
                type: type.toUpperCase(),
                orgId: orgId,
                privilege: this.permissionLookup[type].read,
            },
            {
                type: type.toUpperCase(),
                orgId: orgId,
                privilege: this.permissionLookup[type].write,
            },
            {
                type: type.toUpperCase(),
                orgId: orgId,
                privilege: this.permissionLookup[type].admin,
            },
        ];
        return this.lookupPermission(type, lookups);
    }

    public updateOrgPermissions(orgId: string, reqOb: PermissionUpdateRequest): VePromise<PermissionUpdateResponse> {
        const url = this.uRLSvc.getOrgPermissionURL(orgId);
        return this._updatePermissions(url, reqOb);
    }

    public updateProjectPermissions(
        projectId: string,
        reqOb: PermissionUpdateRequest
    ): VePromise<PermissionUpdateResponse> {
        const url = this.uRLSvc.getProjectPermissionURL(projectId);
        return this._updatePermissions(url, reqOb);
    }

    public updateRefPermissions(
        projectId: string,
        refId: string,
        reqOb: PermissionUpdateRequest
    ): VePromise<PermissionUpdateResponse> {
        const url = this.uRLSvc.getRefPermissionURL(projectId, refId);
        return this._updatePermissions(url, reqOb);
    }

    public updateGroupPermissions(
        groupName: string,
        reqOb: PermissionUpdateRequest
    ): VePromise<PermissionUpdateResponse> {
        const url = this.uRLSvc.getGroupPermissionURL(groupName);
        return this._updatePermissions(url, reqOb);
    }

    private _updatePermissions(url: string, reqOb: PermissionUpdateRequest): VePromise<PermissionUpdateResponse> {
        return new this.$q<PermissionUpdateResponse>((resolve, reject) => {
            this.$http.post<PermissionUpdateResponse, PermissionUpdateRequest>(url, reqOb).then((response) => {
                resolve(response.data);
            }, reject);
        });
    }

    public lookupRefPermission(projectId: string, refId: string): VePromise<string, PermissionLookupResponse> {
        const type = 'branch';
        const lookups: PermissionLookupObject[] = [
            {
                type: type.toUpperCase(),
                projectId: projectId,
                refId: refId,
                privilege: this.permissionLookup[type].read,
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                refId: refId,
                privilege: this.permissionLookup[type].write,
            },
            {
                type: type.toUpperCase(),
                projectId: projectId,
                refId: refId,
                privilege: this.permissionLookup[type].admin,
            },
        ];
        return this.lookupPermission(type, lookups);
    }

    public initializePermission(
        orgId: string,
        projectId?: string,
        refId?: string
    ): VePromise<PermissionCache, PermissionResponse> {
        return new this.$q((resolve, reject) => {
            const promises: VePromise<PermissionMap, PermissionResponse>[] = [];
            const org = this.getOrgPermission(orgId);
            const username = this.userSvc.getUsername();
            org.then((result) => {
                this.permission.org[orgId] =
                    result.users && result.users[username] ? result.users[username].role : Role.READ;
            }, reject);
            promises.push(org);

            if (projectId) {
                const project = this.getProjectPermission(projectId);
                project.then((result) => {
                    this.permission.project[projectId] =
                        result.users && result.users[username] ? result.users[username].role : Role.READ;
                }, reject);
                promises.push(project);
            }

            if (refId) {
                const ref = this.getRefPermission(projectId, refId);
                ref.then((result) => {
                    this.permission.ref[projectId + '/' + refId] =
                        result.users && result.users[username] ? result.users[username].role : Role.READ;
                }, reject);
                promises.push(ref);
            }

            this.$q.all(promises).finally(() => {
                resolve(this.permission);
            });
        });
    }

    public hasOrgEditPermission = (orgId: string): boolean => {
        return this.permission.org[orgId] == Role.WRITE || this.permission.org[orgId] == Role.ADMIN;
    };

    public hasProjectEditPermission = (projectId: string): boolean => {
        return this.permission.project[projectId] == Role.WRITE || this.permission.project[projectId] == Role.ADMIN;
    };

    public hasBranchEditPermission = (projectId: string, refId: string): boolean => {
        return (
            this.permission.ref[projectId + '/' + refId] == Role.WRITE ||
            this.permission.ref[projectId + '/' + refId] == Role.ADMIN
        );
    };

    public hasAdminPermission = (username: string): VePromise<boolean, UsersResponse> => {
        return new this.$q((resolve, reject) => {
            this.userSvc.getUserData(username).then(
                (user) => {
                    resolve(user.admin);
                },
                (reason) => {
                    reject(reason);
                }
            );
        });
    };
}

veUtils.service('PermissionService', PermissionService);
