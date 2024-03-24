import { URLService, UserService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { PermissionsLookupResponse, PermissionsLookupObject, UsersResponse, PermissionsResponse } from '@ve-types/mms';

export interface PermissionCache {
    org: { [id: string]: boolean };
    project: { [id: string]: boolean };
    ref: { [id: string]: boolean };
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
    private editPermissions: PermissionCache = { org: {}, project: {}, ref: {} };

    private updatePermissions: PermissionCache = { org: {}, project: {}, ref: {} };

    static $inject = ['$q', '$http', 'URLService', 'UserService'];

    constructor(private $q: VeQService, private $http: angular.IHttpService, private uRLSvc: URLService, private userSvc: UserService) {}


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

    public getProjectPermissions(projectId: string): VePromise<PermissionsResponse> {
        const url = this.uRLSvc.getProjectPermissionsURL(projectId);
        return new this.$q((resolve,reject) => {
            this.$http.get<PermissionsResponse>(url).then(
                (response) => {
                    
                }
            )
            //Cache it in normal object cache?
        })
    }
    
    public initializeEditPermissions(
        orgId: string,
        projectId: string,
        refId: string
    ): VePromise<PermissionCache, PermissionsLookupResponse> {

        return new this.$q((resolve,reject) => {

        
        if ((!projectId && this.editPermissions.org[orgId] !== undefined) || (
            this.editPermissions.org[orgId] !== undefined &&
            this.editPermissions.project[projectId] !== undefined &&
            this.editPermissions.ref[projectId + '/' + refId] !== undefined
        )) {
            resolve(this.editPermissions);
        }
        const lookups: PermissionsLookupObject[] = []
        if (orgId) {
            lookups.push({
                type: 'ORG',
                orgId: orgId,
                privilege: 'ORG_EDIT',
            })
        }
        if (projectId) {
            lookups.push({
                type: 'PROJECT',
                projectId: projectId,
                privilege: 'PROJECT_EDIT',
            })
        }
        if (refId) {
            lookups.push({
                type: 'BRANCH',
                projectId: projectId,
                refId: refId,
                privilege: 'BRANCH_EDIT_CONTENT',
            })
        }

        this.lookupPermissions(lookups)
            .then(
                (response) => {
                    this._cachePermissions(response, this.editPermissions)
                    resolve(this.editPermissions);
                },
                (response: angular.IHttpResponse<PermissionsLookupResponse>) => {
                    reject(this.uRLSvc.handleHttpStatus(response));
                }
            );

        })
    }

    public initializeUpdatePermissions(
            orgId: string,
            projectId: string
        ): VePromise<PermissionCache, PermissionsLookupResponse> {
    
        return new this.$q((resolve,reject) => {
            if ((!projectId && this.updatePermissions.org[orgId] !== undefined) || (
                    this.updatePermissions.org[orgId] !== undefined &&
                    this.updatePermissions.project[projectId] !== undefined
                )
            ) {
                resolve(this.updatePermissions);
            }
            const lookups: PermissionsLookupObject[] = [
                {
                    type: 'ORG',
                    orgId: orgId,
                    privilege: 'ORG_UPDATE_PERMISSIONS',
                },
            ]
            if (projectId) {
                lookups.push({
                    type: 'PROJECT',
                    projectId: projectId,
                    privilege: 'PROJECT_UPDATE_PERMISSIONS'
                })
            
            }
            this.lookupPermissions(lookups)
            .then(
                (response) => {
                    this._cachePermissions(response, this.updatePermissions)
                    resolve(this.updatePermissions);
                },
                (response: angular.IHttpResponse<PermissionsLookupResponse>) => {
                    reject(this.uRLSvc.handleHttpStatus(response));
                }
            );
    
        })
    }

    private _cachePermissions(lookups: PermissionsLookupObject[], permissionsCache: PermissionCache): void {
        lookups.forEach((lookup) => {
            if (lookup.type == 'ORG'){
                permissionsCache.org[lookup.orgId] = lookup.hasPrivilege;
            } else if (lookup.type == 'PROJECT') {
                permissionsCache.project[lookup.projectId] = lookup.hasPrivilege;
            } else {
                permissionsCache.ref[lookup.projectId + '/' + lookup.refId] = lookup.hasPrivilege;
            }
        })
    }

    public hasProjectEditPermission = (projectId: string): boolean => {
        return this.editPermissions.project[projectId];
    };

    public hasBranchEditPermission = (projectId: string, refId: string): boolean => {
        return this.editPermissions.ref[projectId + '/' + refId];
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
