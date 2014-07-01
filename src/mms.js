'use strict';

/**
 * @ngdoc overview
 * @name mms
 
 * @description
 * module
 */
angular.module('mms', [])
.config(['$sceProvider', function($sceProvider) {
    $sceProvider.enabled(false);
}])
.constant('_', window._);