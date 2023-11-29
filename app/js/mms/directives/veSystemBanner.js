'use strict';

angular.module('mmsApp').directive('veSystemBanner', [ '$templateCache', veSystemBanner]);

function veSystemBanner($templateCache) {
    var template = $templateCache.get('partials/mms/veBanner.html');

    //var no_banner = { template: '' };
    //if ( !BrandingService.hasOwnProperty('banner') ||
    //     !BrandingService.banner.hasOwnProperty('message') ) {
    //    return no_banner;
    //};
    var veBannerLink = function(scope) {
        scope.ve_banner = scope.banner;
    };


    return {
        template: template,
        link: veBannerLink
    };
}