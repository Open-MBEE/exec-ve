import angular from 'angular'

import {
    CacheService,
    ElementService,
    HttpService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { AutosaveService, SessionService } from '@ve-utils/services'

import { veUtils } from '@ve-utils'

import {
    AuthResponse,
    CheckAuthResponse,
    UserObject,
    UsersResponse,
} from '@ve-types/mms'

/**
 * @ngdoc service
 * @name veUtils/ApplicationService
 * @requires $q
 * @requires $http
 * @requires URLService
 * @requires HttpService
 * @requires ElementService
 * @requires ViewService
 * @requires ProjectService
 *
 * @description
 * Provide general authorization functions. I.e. login, logout, etc...
 */
export class AuthService {
    private token: string | null
    static injector = [
        '$q',
        '$http',
        'CacheService',
        'URLService',
        'HttpService',
        'ElementService',
        'ViewService',
        'ProjectService',
        'SessionService',
        'AutosaveService',
    ]
    constructor(
        private $q: angular.IQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService,
        private httpSvc: HttpService,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private projectSvc: ProjectService,
        private sessionSvc: SessionService,
        private autosaveSvc: AutosaveService
    ) {
        this.token = localStorage.getItem('token')
    }

    getAuthorized(credentialsJSON): angular.IPromise<string> {
        const deferred: angular.IDeferred<string> = this.$q.defer()
        const loginURL = this.uRLSvc.getAuthenticationUrl()
        this.$http.post(loginURL, credentialsJSON).then(
            (success: angular.IHttpResponse<AuthResponse>) => {
                this.uRLSvc.setToken(success.data.token)
                this.token = success.data.token
                localStorage.setItem('token', this.token)
                deferred.resolve(this.token)
            },
            (fail: angular.IHttpResponse<AuthResponse>) => {
                deferred.reject(
                    this.uRLSvc.handleHttpStatus(
                        fail.data,
                        fail.status,
                        fail.headers,
                        fail.config
                    )
                )
            }
        )
        return deferred.promise
    }

    removeToken() {
        localStorage.removeItem('token')
        this.token = undefined
        this.uRLSvc.setToken(null)
        this.httpSvc.dropAll()
        this.elementSvc.reset()
        this.projectSvc.reset()
        this.viewSvc.reset()
        this.cacheSvc.reset()
        this.autosaveSvc.reset()
        this.sessionSvc.clear()
    }

    getToken() {
        return this.token
    }

    checkLogin(): angular.IPromise<CheckAuthResponse> {
        const deferred: angular.IDeferred<CheckAuthResponse> = this.$q.defer()
        if (!this.token) {
            deferred.reject(false)
            return deferred.promise
        }
        this.uRLSvc.setToken(this.token)
        this.$http.get(this.uRLSvc.getCheckTokenURL()).then(
            (response: angular.IHttpResponse<CheckAuthResponse>) => {
                if (response.status === 401) {
                    deferred.reject(response)
                } else {
                    deferred.resolve(response.data)
                }
            },
            (fail) => {
                deferred.reject(fail)
                this.removeToken()
            }
        )
        return deferred.promise
    }

    // async isAuthenticated(): Promise<boolean> {
    //     return new Promise<boolean>((resolve, reject) =>{
    //         resolve = (result) => {
    //             return result;
    //         }
    //         reject = () => {
    //             this.removeToken();
    //             return false;
    //         }
    //         this.$http.get(this.uRLSvc.getCheckTokenURL()).then((success:IHttpResponse<any>) => {
    //             if (success.data.status === 401)
    //                 return resolve(false);
    //             return resolve(true)
    //
    //         }, (fail) =>{
    //             return reject(fail);
    //         });
    //     })
    // }

    getUserData(username: string): angular.IPromise<UserObject> {
        const deferred: angular.IDeferred<UserObject> = this.$q.defer()
        const key = ['user', username]
        const urlkey = this.uRLSvc.getPersonURL(username)
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get<UserObject>(key))
        } else {
            this.$http.get(urlkey).then(
                (response: angular.IHttpResponse<UsersResponse>) => {
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
                    this.uRLSvc.handleHttpStatus(
                        response.data,
                        response.status,
                        response.headers,
                        response.config
                    )
                    deferred.reject(response)
                }
            )
        }
        return deferred.promise
    }

    logout() {
        const deferred = this.$q.defer()
        this.checkLogin()
            .then(
                () => {
                    this.removeToken()
                    //$cookies.remove('com.tomsawyer.web.license.user');
                },
                () => {
                    this.removeToken()
                }
            )
            .finally(() => {
                deferred.resolve(true)
            })
        return deferred.promise
    }
}

AuthService.$inject = AuthService.injector

veUtils.service('AuthService', AuthService)
