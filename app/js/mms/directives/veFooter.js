'use strict';

angular.module('mmsApp').directive('veFooter', [ '$templateCache', veFooter]);

function veFooter($templateCache) {
    var template = $templateCache.get('partials/mms/veFooter.html');

    var veFooterLink = function(scope) {
        scope.ve_footer = scope.footer;
    };


    return {
        template: template,
        link: veFooterLink
    };
}