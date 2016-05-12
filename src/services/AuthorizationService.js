'use strict';

angular.module('mms')
.factory('AuthorizationService', ['$q', '$http', 'URLService','$window', AuthorizationService]);

function AuthorizationService($q, $http, URLService, $window) {
    
    var ticket;
    var getAuthorized = function (credentials) {
        var deferred = $q.defer();
        var loginURL = '/alfresco/service/api/login';
        $http.post(loginURL, credentials).then(function (success) {
            console.log("AuthorizationService ticket is: " + success.data.data.ticket);
            URLService.setTicket(success.data.data.ticket);
            ticket = success.data.data.ticket;
            $window.localStorage.setItem('ticket', ticket);
            deferred.resolve(ticket);
        }, function(fail){
            URLService.handleHttpStatus(fail.data, fail.status, fail.header, fail.config, deferred);
        });
        return deferred.promise;
    };

    var getTicket = function(){
        return ticket;
    };

    
    return {
        getAuthorized: getAuthorized,    
        getTicket: getTicket    
    };

}