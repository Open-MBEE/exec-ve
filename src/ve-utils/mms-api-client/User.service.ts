import { CacheService } from '@ve-utils/core';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';
import { URLService } from '@ve-utils/mms-api-client/URL.service';

import { veUtils } from '@ve-utils';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import { UserObject, UsersResponse } from '@ve-types/mms';

export class UserService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'URLService'];

    private username: string;

    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService
    ) {
        super();
        this.username = localStorage.getItem('username');
    }

    getUsername(): string {
        return this.username;
    }

    setUsername(username: string): void {
        localStorage.setItem('username', username);
        this.username = username;
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

    getUserData(username: string, updateCache?: boolean): VePromise<UserObject, UsersResponse> {
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

    getCurrentUser(updateCache?: boolean): VePromise<UserObject, UsersResponse> {
        return this.getUserData(this.username, updateCache);
    }

    reset = (): void => {
        this.inProgress = {};
        this.username = null;
        localStorage.removeItem('username');
    };
}

veUtils.service('UserService', UserService);
