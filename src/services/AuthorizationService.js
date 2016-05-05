'use strict';

angular.module('mms')
.factory('AuthorizationService', ['$q', '$http', 'URLService', AuthorizationService]);

function AuthorizationService($q, $http, URLService) {
    
    var ticket = 'no ticket';
    var getAuthorized = function (credentials) {
        var loginURL = '/alfresco/service/api/login';
        return $http.post(loginURL, credentials).then(function (success) {
            URLService.setTicket(success.ticket);
            ticket = success.ticket;
        }, function(fail){
            // something happens
            //403
        });
    };
    var getTicket = function(){
        return ticket;
    };

    
    return {
        getAuthorized: getAuthorized,        
    };

}