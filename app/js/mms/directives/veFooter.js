'use strict';

angular.module('mmsApp')
.directive('veFooter', ['$templateCache', veFooter]);

/**
* @ngdoc directive
* @name mmsApp.directive:veFooter
*
* @restrict E
*
* @description
* Displays VE footer
* Customize by updating partials/mms/veFooter.html
*
*/
function veFooter($templateCache) {
    var template = $templateCache.get('partials/mms/veFooter.html');

    return {
        restrict: 'E',
        template: template,
        transclude: true
    };
}