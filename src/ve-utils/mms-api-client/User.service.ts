import { CacheService } from '@ve-utils/core';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';
import { URLService } from '@ve-utils/mms-api-client/URL.service';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import { UserObject, UsersResponse } from '@ve-types/mms';

export class UserService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'URLService'];

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService
    ) {
        super();
    }

    getUserData(username: string): VePromise<UserObject, UsersResponse> {
        const key = ['user', username];
        const url = this.uRLSvc.getPersonURL(username);
        const cached = this.cacheSvc.get<UserObject>(key);
        if (this._isInProgress(url)) {
            return this._getInProgress(url) as VePromise<UserObject, UsersResponse>;
        }
        if (cached) {
            return new this.$q<UserObject, UsersResponse>((resolve, reject) => {
                return resolve(cached);
            });
        }
        this._addInProgress(
            url,
            new this.$q<UserObject, UsersResponse>((resolve, reject) => {
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
                        (response: angular.IHttpResponse<UsersResponse>) => {
                            this.uRLSvc.handleHttpStatus(response);
                            reject(response);
                        }
                    )
                    .finally(() => {
                        this._removeInProgress(url);
                    });
            })
        );

        return this._getInProgress(url) as VePromise<UserObject, UsersResponse>;
    }
}

veUtils.service('UserService', UserService);
