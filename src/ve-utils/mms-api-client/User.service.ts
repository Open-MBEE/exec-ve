import { CacheService } from '@ve-utils/core';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';
import { URLService } from '@ve-utils/mms-api-client/URL.service';

import { veUtils } from '@ve-utils';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import { UserGroupsResponse, UserObject, UsersResponse } from '@ve-types/mms';

export class UserService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'URLService'];

    private username: string;

    private authorities: string[];

    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService
    ) {
        super();
    }

    getUsername(): string {
        return this.username;
    }

    setUsername(username: string): void {
        this.username = username;
    }

    getAuthorities(): string[] {
        return this.authorities;
    }

    setAuthorities(authorities: string[]): void {
        this.authorities = authorities;
    }

    getUsers(updateCache?: boolean): VePromise<UserObject[], UsersResponse> {
        const url = this.uRLSvc.getUsersURL();

        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<UserObject[], UsersResponse>((resolve, reject) => {
                    const key = ['users'];
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get<UserObject[]>(key));
                        this._removeInProgress(url);
                    } else {
                        this.$http
                            .get<UsersResponse>(url)
                            .then(
                                (response) => {
                                    if (!response.data.users || response.data.users.length < 1) {
                                        reject({
                                            status: 404,
                                            message: 'User not found',
                                            data: null,
                                            headers: null,
                                        });
                                    } else {
                                        this.cacheSvc.put(key, response.data.users, false);
                                        resolve(this.cacheSvc.get<UserObject[]>(key));
                                    }
                                },
                                (response: VeHttpResponse<UsersResponse>) => {
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
        return this._getInProgress(url) as VePromise<UserObject[], UsersResponse>;
    }

    getUser(username: string, updateCache?: boolean): VePromise<UserObject, UsersResponse> {
        const url = this.uRLSvc.getUserURL(username);

        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<UserObject, UsersResponse>((resolve, reject) => {
                    const key = ['user', username];
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get<UserObject>(key));
                        this._removeInProgress(url);
                    } else {
                        this.$http
                            .get<UsersResponse>(url)
                            .then(
                                (response) => {
                                    if (!response.data.users || response.data.users.length < 1) {
                                        reject({
                                            status: 404,
                                            message: 'User not found',
                                        });
                                    } else {
                                        const user = response.data.users[0];
                                        if (user.fullName != 'null null') {
                                            user.fullName = user.fullName
                                                ? user.fullName
                                                : `${user.firstName} ${user.lastName}`;
                                        } else {
                                            user.fullName = '';
                                        }
                                        this.cacheSvc.put(key, response.data.users[0], false);
                                        resolve(this.cacheSvc.get<UserObject>(key));
                                    }
                                },
                                (response: VeHttpResponse<UsersResponse>) => {
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

        return this._getInProgress(url) as VePromise<UserObject, UsersResponse>;
    }

    getUserGroups(username: string, updateCache?: boolean): VePromise<string[], UserGroupsResponse> {
        const url = this.uRLSvc.getUserGroupsURL(username);
        if (!this._isInProgress(url)) {
            this._addInProgress(
                url,
                new this.$q<string[], UserGroupsResponse>((resolve, reject) => {
                    const key = ['user', username, 'groups'];
                    if (this.cacheSvc.exists(key) && !updateCache) {
                        resolve(this.cacheSvc.get<string[]>(key));
                        this._removeInProgress(url);
                    } else {
                        this.$http.get<UserGroupsResponse>(url).then((response) => {
                            resolve(this.cacheSvc.put(key, response.data.groups));
                        }, reject);
                    }
                })
            );
        }

        return this._getInProgress(url) as VePromise<string[], UserGroupsResponse>;
    }

    getCurrentUser(updateCache?: boolean): VePromise<UserObject, UsersResponse> {
        return this.getUser(this.username, updateCache);
    }

    reset(): void {
        this.username = null;
        this.authorities = [];
        super.reset();
    }
}

veUtils.service('UserService', UserService);
