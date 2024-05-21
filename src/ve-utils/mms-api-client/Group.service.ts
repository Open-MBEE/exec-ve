import { CacheService } from '@ve-utils/core';

import { veUtils } from '@ve-utils';

import { BaseApiService } from './Base.service';
import { URLService } from './URL.service';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import { GroupObject, GroupUsersResponse, GroupsResponse } from '@ve-types/mms';

export class GroupService extends BaseApiService {
    static $inject = ['$q', '$http', 'URLService', 'CacheService'];
    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private uRLSvc: URLService,
        private cacheSvc: CacheService
    ) {
        super();
    }

    getAllGroups(updateCache?: boolean): VePromise<GroupObject[], GroupsResponse> {
        const url = this.uRLSvc.getGroupsURL();

        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<GroupObject[], GroupsResponse>((resolve, reject) => {
                    const key = ['groups'];
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get(key));
                        this._removeInProgress(url);
                    } else {
                        this.$http
                            .get<GroupsResponse>(url)
                            .then(
                                (response) => {
                                    this.cacheSvc.put(key, response.data.groups, false);
                                    resolve(this.cacheSvc.get(key));
                                },
                                (response: VeHttpResponse<GroupsResponse>) => {
                                    this.uRLSvc.handleHttpStatus(response);
                                    reject(response);
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

    getGroups(groupnames: string[], updateCache?: boolean): VePromise<GroupObject[], GroupsResponse> {
        return new this.$q((resolve, reject) => {
            this.getAllGroups(updateCache).then((result) => {
                const groups: GroupObject[] = result.filter((group) => {
                    return groupnames.includes(group.name);
                });
                if (groups.length != groupnames.length) {
                    reject({
                        status: 404,
                        message: 'Not All Groups found',
                    });
                } else {
                    resolve(groups);
                }
            }, reject);
        });
    }

    getGroup(groupname: string, updateCache?: boolean): VePromise<GroupObject, GroupsResponse> {
        const url = this.uRLSvc.getGroupURL(groupname);

        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<GroupObject, GroupsResponse>((resolve, reject) => {
                    const key = ['group', groupname];
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get(key));
                        this._removeInProgress(url);
                    } else {
                        this.$http
                            .get<GroupsResponse>(url)
                            .then(
                                (response) => {
                                    if (!response.data.groups || response.data.groups.length < 1) {
                                        reject({
                                            status: 404,
                                            message: 'Group not found',
                                        });
                                    } else {
                                        this.cacheSvc.put(key, response.data.groups[0], false);
                                        resolve(this.cacheSvc.get(key));
                                    }
                                },
                                (response: VeHttpResponse<GroupsResponse>) => {
                                    this.uRLSvc.handleHttpStatus(response);
                                    reject(response);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(url);
                            });
                    }
                })
            );
        }

        return this._getInProgress(url) as VePromise<GroupObject, GroupsResponse>;
    }

    getGroupUsers(groupname: string, updateCache?: boolean): VePromise<string[], GroupUsersResponse> {
        const url = this.uRLSvc.getGroupUsersURL(groupname);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<string[], GroupUsersResponse>((resolve, reject) => {
                    const key = ['group', groupname, 'users'];
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get<string[]>(key));
                        this._removeInProgress(url);
                    } else {
                        this.$http.get<GroupUsersResponse>(url).then((response) => {
                            resolve(this.cacheSvc.put(key, response.data.users));
                        }, reject);
                    }
                })
            );
        }

        return this._getInProgress(url) as VePromise<string[], GroupUsersResponse>;
    }
}

veUtils.service('GroupService', GroupService);
