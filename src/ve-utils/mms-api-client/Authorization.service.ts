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

import { GroupService } from './Group.service';

import { VeHttpResponse, VeHttpService, VePromise, VeQService } from '@ve-types/angular';
import { AuthRequest, AuthResponse, CheckAuthResponse, JsonWebToken } from '@ve-types/mms';

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
        'GroupService',
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
        private orgSvc: OrgService,
        private groupSvc: GroupService
    ) {
        this.token = sessionStorage.getItem('token');
        if (this.token) {
            const jwt = this.parseJwt(this.token);
            this.userSvc.setUsername(jwt.sub);
            this.userSvc.setAuthorities(jwt.authorities);
        } else {
            this.removeToken();
        }
    }

    getAuthorized(credentialsJSON: AuthRequest): VePromise<string, AuthResponse> {
        const deferred = this.$q.defer<string>();
        const loginURL = this.uRLSvc.getAuthenticationUrl();
        this.$http.post<AuthResponse, AuthRequest>(loginURL, credentialsJSON).then(
            (success) => {
                this.uRLSvc.setToken(success.data.token);
                this.token = success.data.token;
                this.userSvc.setUsername(credentialsJSON.username);
                sessionStorage.setItem('token', this.token);
                deferred.resolve(this.token);
            },
            (fail: VeHttpResponse<AuthResponse>) => {
                deferred.reject(this.uRLSvc.handleHttpStatus(fail));
            }
        );
        return deferred.promise;
    }

    removeToken = (): void => {
        sessionStorage.removeItem('token');
        this.token = undefined;
        this.userSvc.reset();
        this.groupSvc.reset();
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
        sessionStorage.setItem('token', token);
        this.token = token;
        this.uRLSvc.setToken(token);
        const jwt = this.parseJwt(token);
        this.userSvc.setUsername(jwt.sub);
        this.userSvc.setAuthorities(jwt.authorities);
    };

    checkLogin(): VePromise<void, CheckAuthResponse> {
        return new this.$q((resolve, reject) => {
            if (!this.token) {
                reject(null);
            }
            //this.uRLSvc.setToken(this.token);
            this.$http.get<CheckAuthResponse>(this.uRLSvc.getCheckTokenURL()).then(
                (response) => {
                    if (response.status === 401) {
                        reject(response);
                    } else {
                        //this.userSvc.setUsername(response.data.username);
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

    parseJwt(token: string): JsonWebToken {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );

        return JSON.parse(jsonPayload) as JsonWebToken;
    }
}

veUtils.service('AuthService', AuthService);
