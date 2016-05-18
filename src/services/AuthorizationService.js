'use strict';

angular.module('mms')
.factory('AuthorizationService', ['$q', '$http', 'URLService','$window', AuthorizationService]);

function AuthorizationService($q, $http, URLService, $window) {
    
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
            $http.get(URLService.getCheckLoginURL(), {
                headers: {
                    'Authorization': 'Basic ' + $window.btoa(credentials.username + ':' + credentials.password),
                    'withCredentials' : 'true'
                }
            });
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
            deferred.resolve(true);
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
            //var logoutService = '/alfresco/service/api/login/ticket/'+ AuthorizationService.getTicket() + '?alf_ticket=' + AuthorizationService.getTicket();
            $http.delete(URLService.getLogoutURL()).then(function(success) {
                removeTicket();
                //$location.path('/login');
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