import { CacheService } from '@ve-utils/core';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';
import { URLService } from '@ve-utils/mms-api-client/URL.service';

import { veUtils } from '@ve-utils';

import { OrgService } from './Org.service';
import { ProjectService } from './Project.service';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import { OrgObject, OrgsResponse, ProjectObject, ProjectsResponse, UserObject, UsersResponse } from '@ve-types/mms';

export class UserService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'OrgService', 'ProjectService', 'URLService'];

    private username: string;

    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private cacheSvc: CacheService,
        private orgSvc: OrgService,
        private projectSvc: ProjectService,
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

    getCurrentUser(updateCache?: boolean): VePromise<UserObject, UsersResponse> {
        return this.getUserData(this.username, updateCache);
    }

    getUserOrg(updateCache?: boolean): VePromise<OrgObject, OrgsResponse> {
        return new this.$q((resolve, reject) => {
            this.orgSvc.getOrg(this.username, updateCache).then(
                (data) => {
                    resolve(data);
                },
                (reason) => {
                    if (reason.status == 404) {
                        this.getUserData(this.username).then((user) => {
                            const reqOb: OrgObject = {
                                id: `${this.username}-personal`,
                                name: `${user.fullName != '' ? user.fullName : user.username}'s Personal Org`,
                                public: false,
                            };
                            this.orgSvc.createOrg(reqOb).then(resolve, reject);
                        }, reject);
                    } else {
                        reject(reason);
                    }
                }
            );
        });
    }

    getUserHome(updateCache?: boolean): VePromise<ProjectObject, ProjectsResponse> {
        return new this.$q((resolve, reject) => {
            this.projectSvc.getProject(`${this.username}-home`, updateCache).then(resolve, (reason) => {
                if (reason.status == 404) {
                    this.getUserData(this.username).then((user) => {
                        const reqOb: ProjectObject = {
                            id: `${this.username}-home`,
                            orgId: `${this.username}-personal`,
                            name: `${user.fullName != '' ? user.fullName : user.username}'s Home`,
                            public: false,
                        };
                        this.projectSvc.createProject(reqOb).then(resolve, reject);
                    }, reject);
                } else {
                    reject(reason);
                }
            });
        });
    }

    reset = (): void => {
        this.inProgress = {};
        this.username = null;
        localStorage.removeItem('username');
    };
}

veUtils.service('UserService', UserService);
