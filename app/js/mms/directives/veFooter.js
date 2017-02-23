'use strict';

angular.module('mmsApp')
    .directive('veFooter', ['$templateCache', veFooter]);

function veFooter($templateCache) {
    var template = $templateCache.get('partials/mms/veFooter.html');

    return {
        restrict: 'E',
        template: template,
        transclude: true
    };
}