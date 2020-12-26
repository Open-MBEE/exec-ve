import * as angular from 'angular';

angular.module('mms').service('ConfigService', ['$http', ConfigService]);
/**
 * @ngdoc service
 * @name mms.ConfigService
 * @requires $http
 *
 * @description
 * Provides promise containing the key value pairs stored in the 'app/config.json' file.
 */
function ConfigService($http) {
  return function() {
    return $http.get('config/config.json');
  };
}
