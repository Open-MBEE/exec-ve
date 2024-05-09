import { CacheService, EditService, SessionService } from '@ve-utils/core';
import {
    ElementService,
    HttpService,
    OrgService,
    ProjectService,
    URLService,
    UserService,
    ViewService,
} from '@ve-utils/mms-api-client';

import { veUtils } from '@ve-utils';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import { AuthRequest, AuthResponse, CheckAuthResponse } from '@ve-types/mms';

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
 * * Provide general authorization functions. I.e. login, logout, etc...
 */
export class AuthService {
    private token: string | null;
    static $inject = [
        '$q',
        '$http',
        'CacheService',
        'URLService',
        'HttpService',
        'ElementService',
        'ViewService',
        'ProjectService',
        'SessionService',
        'EditService',
        'UserService',
        'OrgService',
    ];
    constructor(
        private $q: VeQService,
        private $http: VeHttpService,
        private cacheSvc: CacheService,
        private uRLSvc: URLService,
        private httpSvc: HttpService,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private projectSvc: ProjectService,
        private sessionSvc: SessionService,
        private autosaveSvc: EditService,
        private userSvc: UserService,
        private orgSvc: OrgService
    ) {
        this.token = localStorage.getItem('token');
    }

    getAuthorized(credentialsJSON: AuthRequest): VePromise<string, AuthResponse> {
        const deferred = this.$q.defer<string>();
        const loginURL = this.uRLSvc.getAuthenticationUrl();
        this.$http.post<AuthResponse, AuthRequest>(loginURL, credentialsJSON).then(
            (success) => {
                this.uRLSvc.setToken(success.data.token);
                this.token = success.data.token;
                this.userSvc.setUsername(credentialsJSON.username);
                localStorage.setItem('token', this.token);
                deferred.resolve(this.token);
            },
            (fail: VeHttpResponse<AuthResponse>) => {
                deferred.reject(this.uRLSvc.handleHttpStatus(fail));
            }
        );
        return deferred.promise;
    }

    removeToken = (): void => {
        localStorage.removeItem('token');
        this.token = undefined;
        this.userSvc.reset();
        this.uRLSvc.setToken(null);
        this.httpSvc.dropAll();
        this.elementSvc.reset();
        this.projectSvc.reset();
        this.orgSvc.reset();
        this.viewSvc.reset();
        this.cacheSvc.reset();
        this.autosaveSvc.reset();
        this.sessionSvc.clear();
    };

    getToken = (): string => {
        return this.token;
    };

    setToken = (token: string): void => {
        localStorage.setItem('token', token);
        this.token = token;
        this.uRLSvc.setToken(token);
    };

    checkLogin(): VePromise<void, CheckAuthResponse> {
        return new this.$q((resolve, reject) => {
            if (!this.token) {
                reject(null);
            }
            this.uRLSvc.setToken(this.token);
            this.$http.get<CheckAuthResponse>(this.uRLSvc.getCheckTokenURL()).then(
                (response) => {
                    if (response.status === 401) {
                        reject(response);
                    } else {
                        this.userSvc.setUsername(response.data.username);
                        resolve();
                    }
                },
                (fail: VeHttpResponse<CheckAuthResponse>) => {
                    reject(fail);
                    this.removeToken();
                }
            );
        });
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

    logout(): VePromise<boolean> {
        const deferred = this.$q.defer<boolean>();
        this.checkLogin()
            .then(
                () => {
                    this.removeToken();
                    //$cookies.remove('com.tomsawyer.web.license.user');
                },
                () => {
                    this.removeToken();
                }
            )
            .finally(() => {
                deferred.resolve(true);
            });
        return deferred.promise;
    }
}

veUtils.service('AuthService', AuthService);
