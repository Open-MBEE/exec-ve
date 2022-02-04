'use strict';

angular.module('mms')
    .factory('AuthService', ['$q', '$http', 'CacheService', 'URLService', 'HttpService', 'ElementService', 'ViewService', 'ProjectService', 'SessionService', 'EditService', '$window', '$analytics', AuthService]);

/**
 * @ngdoc service
 * @name mms.ApplicationService
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
function AuthService($q, $http, CacheService, URLService, HttpService, ElementService, ViewService, ProjectService, SessionService, EditService, $window, $analytics) {

    var token = $window.localStorage.getItem('token');
    var getAuthorized = function (credentialsJSON) {
        var deferred = $q.defer();
        var loginURL = URLService.getAuthenticationUrl();
        $http.post(loginURL, credentialsJSON).then(function (success) {
            URLService.setToken(success.data.token);
            token = success.data.token;
            $window.localStorage.setItem('token', token);
            deferred.resolve(token);
        }, function(fail){
            URLService.handleHttpStatus(fail.data, fail.status, fail.header, fail.config, deferred);
            deferred.reject(fail);
        });
        return deferred.promise;
    };

    var removeToken = function(){
        $window.localStorage.removeItem('token');
        token = undefined;
        URLService.setToken(null);
        HttpService.dropAll();
        ElementService.reset();
        ProjectService.reset();
        ViewService.reset();
        CacheService.reset();
        EditService.reset();
        SessionService.clear();
    };

    var getToken = function(){
        return token;
    };

    var checkLogin = function(){
        var deferred = $q.defer();
        if (!token) {
            deferred.reject(false);
            return deferred.promise;
        }
        URLService.setToken(token);
        $http.get(URLService.getCheckTokenURL()).then(function (success) {
            deferred.resolve(success.data);
            $analytics.setUsername(success.data.username);
        }, function(fail){
            deferred.reject(fail);
            removeToken();
        });
        return deferred.promise;
    };

    var getUserData = function(username){
        var deferred = $q.defer();
        if (!token) {
            deferred.reject(false);
            return deferred.promise;
        }

        $http.get(URLService.getPersonURL(username)).then(function (success) {
            deferred.resolve(success.data);
        }, function(fail){
            deferred.reject(fail);
            if (fail.status === '401') {
                removeToken();
            }

        });
        return deferred.promise;
    };

    var logout = function() {
        var deferred = $q.defer();
        checkLogin().then(function() {
            removeToken();
            //$cookies.remove('com.tomsawyer.web.license.user');
        }, function() {
            removeToken();
            deferred.resolve(true);
        });
        return deferred.promise;
    };

    return {
        getAuthorized: getAuthorized,
        getToken: getToken,
        removeToken: removeToken,
        checkLogin: checkLogin,
        getUserData: getUserData,
        logout: logout
    };

}
