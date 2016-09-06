'use strict';

angular.module('mms')
.factory('AuthService', ['$q', '$http', 'URLService','HttpService', 'ElementService', 'ViewService', 'ConfigService', 'WorkspaceService', 'SiteService', '$window', '$cookies', AuthService]);

function AuthService($q, $http, URLService, HttpService, ElementService, ViewService, ConfigService, WorkspaceService, SiteService, $window, $cookies) {
    
    var ticket= $window.localStorage.getItem('ticket');
    var getAuthorized = function (credentials) {
        var deferred = $q.defer();
        var loginURL = '/alfresco/service/api/login';
        //var encode = $window.btoa(credentials.username + ' ' + credentials.password);
        //$http.defaults.headers.common.Authorization = 'Basic ' + $window.btoa(credentials.username + ':' + credentials.password);
        $http.post(loginURL, credentials).then(function (success) {
            URLService.setTicket(success.data.data.ticket);
            ticket = success.data.data.ticket;
            $window.localStorage.setItem('ticket', ticket);
            // $http.get(URLService.getCheckLoginURL(), {
            //     headers: {
            //         'Authorization': 'Basic ' + $window.btoa(credentials.username + ':' + credentials.password),
            //         'withCredentials' : 'true'
            //     }
            // });
            deferred.resolve(ticket);
        }, function(fail){
            URLService.handleHttpStatus(fail.data, fail.status, fail.header, fail.config, deferred);
            deferred.reject(fail);
        });
        return deferred.promise;
    };
    
    var removeTicket = function(){
        $window.localStorage.removeItem('ticket');
        ticket = undefined;
        URLService.setTicket(null);
        HttpService.dropAll();
        ElementService.reset();
        ViewService.reset();
        WorkspaceService.reset();
        SiteService.reset();
        ConfigService.reset();
    };

    var getTicket = function(){
        return ticket;
    };
    var checkLogin = function(){
        var deferred = $q.defer();//:TODO
        if (!ticket) {
            deferred.reject(false);
            return deferred.promise;
        }
        //var checkLogin = '/alfresco/service/api/login/ticket/'+ticket+'?alf_ticket='+ticket;
        
        $http.get(URLService.getCheckTicketURL(ticket)).then(function (success) {
            deferred.resolve(success.data.username);
        }, function(fail){
            //if(fail.status === 401) {
                deferred.reject(fail);
                removeTicket();
            //}
        });  
        return deferred.promise;  
    };
    
    var logout = function() {
        var deferred = $q.defer();
        checkLogin().then(function() {
            var logouturl = URLService.getLogoutURL();
            removeTicket();
            //var logoutService = '/alfresco/service/api/login/ticket/'+ AuthService.getTicket() + '?alf_ticket=' + AuthService.getTicket();
            $http.post('/Basic/mms/cookieAuth?op=Sign Out').then(
                function(data){
                    $cookies.remove('com.tomsawyer.web.license.user');
                }, function(failure) {
                    URLService.handleHttpStatus(failure.data, failure.status, failure.headers, failure.config, deferred);
                }
            );
            $http.delete(logouturl).then(function(success) {
                deferred.resolve(true);
                //$state.go('login');
            }, function(failure) {
                URLService.handleHttpStatus(failure.data, failure.status, failure.headers, failure.config, deferred);
                //growl.error('You were not logged out');
            });
        }, function() {
            removeTicket();
            deferred.resolve(true);
        });
        return deferred.promise;
    };
    
    return {
        getAuthorized: getAuthorized,    
        getTicket: getTicket,
        removeTicket: removeTicket,
        checkLogin: checkLogin,
        logout: logout 
    };

}