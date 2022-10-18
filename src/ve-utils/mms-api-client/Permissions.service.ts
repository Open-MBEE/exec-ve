import angular from 'angular'

import { URLService } from '@ve-utils/mms-api-client'

import { veUtils } from '@ve-utils'

import {
    PermissionsObject,
    PermissionsResponse,
    ProjectObject,
    RefObject,
} from '@ve-types/mms'

export interface PermissionCache {
    project: { [id: string]: boolean }
    ref: { [id: string]: boolean }
}

/**
 * @ngdoc service
 * @name PermissionsService
 *
 * @requires $q
 * @requires $http
 * @requires URLService
 *
 * @description
 * This utility service handles permissions inquiries
 */
export class PermissionsService {
    private permissions: PermissionCache = { project: {}, ref: {} }

    constructor(
        private $q: angular.IQService,
        private $http: angular.IHttpService,
        private uRLSvc: URLService
    ) {}

    public initializePermissions(projectOb: ProjectObject, refOb: RefObject) {
        const url = this.uRLSvc.getPermissionsLookupURL()

        const deferred: angular.IDeferred<PermissionCache> = this.$q.defer()

        this.$http
            .put(url, {
                lookups: [
                    {
                        type: 'PROJECT',
                        projectId: projectOb.id,
                        privilege: 'PROJECT_EDIT',
                    },
                    {
                        type: 'BRANCH',
                        projectId: refOb._projectId,
                        refId: refOb.id,
                        privilege: 'BRANCH_EDIT_CONTENT',
                    },
                ],
            })
            .then(
                (response: angular.IHttpResponse<PermissionsResponse>) => {
                    const data: PermissionsObject[] = response.data.lookups
                    if (Array.isArray(data) && data.length > 0) {
                        data.forEach((d) => {
                            if (d.type == 'PROJECT') {
                                this.permissions.project[d.projectId] =
                                    d.hasPrivilege
                            } else {
                                this.permissions.ref[
                                    d.projectId + '/' + d.refId
                                ] = d.hasPrivilege
                            }
                        })
                        deferred.resolve(this.permissions)
                    } else {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        })
                    }
                },
                (response: angular.IHttpResponse<PermissionsResponse>) => {
                    deferred.reject(
                        this.uRLSvc.handleHttpStatus(
                            response.data,
                            response.status,
                            response.headers,
                            response.config
                        )
                    )
                }
            )

        return deferred.promise
    }

    public hasProjectEditPermission(projectOb: string): boolean {
        return this.permissions.project[projectOb]
    }

    public hasBranchEditPermission(refOb: RefObject): boolean {
        return this.hasProjectIdBranchIdEditPermission(
            refOb._projectId,
            refOb.id
        )
    }

    public hasProjectIdBranchIdEditPermission(
        projectId: string,
        refId: string
    ): boolean {
        return this.permissions.ref[projectId + '/' + refId]
    }
}

PermissionsService.$inject = ['$q', '$http', 'URLService']

veUtils.service('PermissionsService', PermissionsService)
