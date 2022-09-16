import * as angular from 'angular'
import {veUtils} from "@ve-utils";
import {CacheService} from "@ve-utils/mms-api-client/Cache.service";
import {URLService} from "@ve-utils/mms-api-client/URL.provider";
import {HttpService} from "@ve-utils/mms-api-client/Http.service";
import {ElementService} from "@ve-utils/mms-api-client/Element.service";
import {ViewService} from "@ve-utils/mms-api-client/View.service";
import {ProjectService} from "@ve-utils/mms-api-client/Project.service";
import {EditService, SessionService} from "@ve-utils/core-services";
import {AuthResponse, CheckAuthResponse, OrgObject, OrgsResponse, UserObject, UsersResponse} from "@ve-types/mms";


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

    private inProgress: { [p: string]: angular.IPromise<any>} = {}

    private token = this.$window.localStorage.getItem('token');
    static injector = ['$q', '$http', '$window', '$analytics', 'CacheService', 'URLService', 'HttpService', 'ElementService', 'ViewService', 'ProjectService', 'SessionService', 'EditService'];
    constructor(private $q, private $http: angular.IHttpService, private $window, private $analytics,
                private cacheSvc : CacheService, private uRLSvc : URLService, private httpSvc : HttpService,
                private elementSvc : ElementService, private viewSvc : ViewService, private projectSvc : ProjectService,
                private sessionSvc : SessionService, private editSvc : EditService) {

    }

    getAuthorized(credentialsJSON) {
        var deferred = this.$q.defer();
        var loginURL = this.uRLSvc.getAuthenticationUrl();
        this.$http.post(loginURL, credentialsJSON).then((success: AuthResponse) => {
            this.uRLSvc.setToken(success.data.token);
            this.token = success.data.token;
            localStorage.setItem('token', this.token);
            deferred.resolve(this.token);
        }, (fail) =>{
            this.uRLSvc.handleHttpStatus(fail.data, fail.status, fail.header, fail.config, deferred);
            deferred.reject(fail);
        });
        return deferred.promise;
    };

    removeToken(){
        this.$window.localStorage.removeItem('token');
        this.token = undefined;
        this.uRLSvc.setToken(null);
        this.httpSvc.dropAll();
        this.elementSvc.reset();
        this.projectSvc.reset();
        this.viewSvc.reset();
        this.cacheSvc.reset();
        this.editSvc.reset();
        this.sessionSvc.clear();
    };

    getToken(){
        return this.token;
    };

    checkLogin(): angular.IPromise<CheckAuthResponse>{
        var deferred: angular.IDeferred<CheckAuthResponse> = this.$q.defer();
        if (!this.token) {
            deferred.reject(false);
            return deferred.promise;
        }
        this.uRLSvc.setToken(this.token);
        this.$http.get(this.uRLSvc.getCheckTokenURL()).then((response: angular.IHttpResponse<CheckAuthResponse>) => {
            if (response.status === 401) {
                deferred.reject(response);
            } else {
                deferred.resolve(response.data);
            }
        }, (fail) =>{
            deferred.reject(fail);
            this.removeToken();
        });
        return deferred.promise;
    };

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
        let deferred: angular.IDeferred<UserObject> = this.$q.defer();
        var key = ['user', username];
        var urlkey = this.uRLSvc.getPersonURL(username);
        if (this.cacheSvc.exists(key)) {
            deferred.resolve(this.cacheSvc.get<UserObject>(key));
        } else {
            this.$http.get(urlkey).then((response: angular.IHttpResponse<UsersResponse>) => {
                if (!response.data.users || response.data.users.length < 1) {
                    deferred.reject({status: 404, data: '', message: 'User not found'});
                } else {
                    this.cacheSvc.put(key, response.data.users[0], false);
                    deferred.resolve(this.cacheSvc.get<UserObject>(key));
                }
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            })

        }
        return deferred.promise;
    };

    logout() {
        var deferred = this.$q.defer();
        this.checkLogin().then(() => {
            this.removeToken();
            //$cookies.remove('com.tomsawyer.web.license.user');
        }, () => {
            this.removeToken();

        }).finally(() => {
            deferred.resolve(true);
        })
        return deferred.promise;
    };
}

AuthService.$inject = AuthService.injector;

veUtils.service('AuthService', AuthService);
