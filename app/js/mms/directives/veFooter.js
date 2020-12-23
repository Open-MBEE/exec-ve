'use strict';

angular.module('mmsApp').directive('veFooter', [ '$templateCache', veFooter]);

function veFooter($templateCache) {
    var template = $templateCache.get('partials/mms/veFooter.html');

    //var no_banner = { template: '' };
    //if ( !BrandingService.hasOwnProperty('banner') ||
    //     !BrandingService.banner.hasOwnProperty('message') ) {
    //    return no_banner;
    //};
    var veFooterLink = function(scope) {
        scope.ve_footer = scope.footer.message;
    };


    return {
        template: template,
        link: veFooterLink
    };
}