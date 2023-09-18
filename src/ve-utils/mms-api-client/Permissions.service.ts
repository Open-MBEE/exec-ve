import { URLService } from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { PermissionsObject, PermissionsResponse, ProjectObject, RefObject } from '@ve-types/mms';

export interface PermissionCache {
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
    private permissions: PermissionCache = { project: {}, ref: {} };

    static $inject = ['$q', '$http', 'URLService'];

    constructor(private $q: VeQService, private $http: angular.IHttpService, private uRLSvc: URLService) {}

    public initializePermissions(
        projectOb: ProjectObject,
        refOb: RefObject
    ): VePromise<PermissionCache, PermissionsResponse> {
        const url = this.uRLSvc.getPermissionsLookupURL();

        const deferred = this.$q.defer<PermissionCache>();
        if (
            this.permissions.project[projectOb.id] !== undefined &&
            this.permissions.ref[projectOb.id + '/' + refOb.id] !== undefined
        ) {
            deferred.resolve(this.permissions);
            return deferred.promise;
        }
        this.$http
            .put<PermissionsResponse>(url, {
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
                (response) => {
                    const data: PermissionsObject[] = response.data.lookups;
                    if (Array.isArray(data) && data.length > 0) {
                        data.forEach((d) => {
                            if (d.type == 'PROJECT') {
                                this.permissions.project[d.projectId] = d.hasPrivilege;
                            } else {
                                this.permissions.ref[d.projectId + '/' + d.refId] = d.hasPrivilege;
                            }
                        });
                        deferred.resolve(this.permissions);
                    } else {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        });
                    }
                },
                (response: angular.IHttpResponse<PermissionsResponse>) => {
                    deferred.reject(this.uRLSvc.handleHttpStatus(response));
                }
            );

        return deferred.promise;
    }

    public hasProjectEditPermission = (projectId: string): boolean => {
        return this.permissions.project[projectId];
    };

    public hasBranchEditPermission = (projectId: string, refId: string): boolean => {
        return this.permissions.ref[projectId + '/' + refId];
    };
}

veUtils.service('PermissionsService', PermissionsService);
