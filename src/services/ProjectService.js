'use strict';

angular.module('mms')
.factory('ProjectService', ['$q', '$http', 'URLService', ProjectService]);

/**
 * @ngdoc service
 * @name mms.ProjectService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * 
 * @description
 * This service gives information about model projects (TBD, stub)
 */
function ProjectService($q, $http, URLService) {

    return {};
    
}