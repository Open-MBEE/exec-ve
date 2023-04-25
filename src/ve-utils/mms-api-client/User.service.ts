import { CacheService } from '@ve-utils/core'
import { URLService } from '@ve-utils/mms-api-client/URL.service'

import { veUtils } from '@ve-utils'

import { VePromise, VeQService } from '@ve-types/angular'
import {BasicResponse, MmsObject, UserObject, UsersResponse} from '@ve-types/mms'
import {BaseApiService} from "@ve-utils/mms-api-client/Base.service";

export class UserService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'URLService']

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService
    ) {super()}

    getUserData(username: string): VePromise<UserObject> {
        const deferred = this.$q.defer<UserObject>()
        const key = ['user', username]
        const urlkey = this.uRLSvc.getPersonURL(username)
        if (this._isInProgress(urlkey)) {
            return this._getInProgress(urlkey) as VePromise<UserObject>
        }
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get<UserObject>(key))
        } else {
            this._addInProgress(urlkey,
            this.$http.get<UsersResponse>(urlkey).then(
                (response) => {
                    if (!response.data.users || response.data.users.length < 1) {
                        deferred.reject({
                            status: 404,
                            data: '',
                            message: 'User not found',
                        })
                    } else {
                        this.cacheSvc.put(key, response.data.users[0], false)
                        deferred.resolve(this.cacheSvc.get<UserObject>(key))
                    }
                },
                (response: angular.IHttpResponse<UsersResponse>) => {
                    this.uRLSvc.handleHttpStatus(response)
                    deferred.reject(response)
                }
            ).finally(() => {
                this._removeInProgress(urlkey)
            }) as unknown as VePromise<MmsObject | MmsObject[], BasicResponse<MmsObject>>)
        }
        return deferred.promise
    }
}

veUtils.service('UserService', UserService)
