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
            deferred.resolve(ticket);
        }, function(fail){
            URLService.handleHttpStatus(fail.data, fail.status, fail.header, fail.config, deferred);
        });
        return deferred.promise;
    };
    
    var removeTicket = function(){
        $window.localStorage.clear();
    };

    var getTicket = function(){
        return ticket;
    };
    var checkLogin = function(){
        var checkLogin = '/alfresco/service/api/login/ticket/'+ticket+'?alf_ticket='+ticket;
        var deferred = $q.defer();//:TODO
        $http.get(checkLogin).then(function (success) {
            deferred.resolve(false);
        }, function(fail){
            if(fail.status === 401)
                deferred.resolve(true);
        });  
        return deferred.promise;  
    };

    
    return {
        getAuthorized: getAuthorized,    
        getTicket: getTicket,
        removeTicket: removeTicket,
        checkLogin: checkLogin    
    };

}