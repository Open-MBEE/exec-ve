import { CacheService } from '@ve-utils/mms-api-client/Cache.service'
import { URLService } from '@ve-utils/mms-api-client/URL.service'

import { veUtils } from '@ve-utils'

import { VePromise, VeQService } from '@ve-types/angular'
import { UserObject, UsersResponse } from '@ve-types/mms'

export class UserService {
    static $inject = ['$q', '$http', 'CacheService', 'URLService']

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService
    ) {}

    getUserData(username: string): VePromise<UserObject> {
        const deferred = this.$q.defer<UserObject>()
        const key = ['user', username]
        const urlkey = this.uRLSvc.getPersonURL(username)
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get<UserObject>(key))
        } else {
            this.$http.get<UsersResponse>(urlkey).then(
                (response) => {
                    if (
                        !response.data.users ||
                        response.data.users.length < 1
                    ) {
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
            )
        }
        return deferred.promise
    }
}

veUtils.service('UserService', UserService)
