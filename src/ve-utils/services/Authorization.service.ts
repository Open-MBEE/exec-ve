import * as angular from 'angular'
import {CacheService} from "./Cache.service";
import {URLService} from "./URL.provider";
import {HttpService} from "./Http.service";
import {ElementService} from "./Element.service";
import {ViewService} from "./View.service";
import {ProjectService} from "./Project.service";
import {SessionService} from "./Session.service";
import {EditService} from "./Edit.service";
import {AuthResponse, CheckAuthResponse} from "../types/mms";
import {veUtils} from "@ve-utils";


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

    getUserData(username){
        var deferred = this.$q.defer();
        if (!this.token) {
            deferred.reject(false);
            return deferred.promise;
        }

        this.$http.get(this.uRLSvc.getPersonURL(username)).then((success) => {
            deferred.resolve(success.data);
        }, (fail) =>{
            deferred.reject(fail);
            if (fail.status === '401') {
                this.removeToken();
            }

        });
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
