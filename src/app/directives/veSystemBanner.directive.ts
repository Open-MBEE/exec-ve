import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');

mmsApp.directive('veSystemBanner', [ '$templateCache', veSystemBanner]);

function veSystemBanner($templateCache) {
    var template = 'partials/mms/veBanner.html';

    //var no_banner = { template: '' };
    //if ( !BrandingService.hasOwnProperty('banner') ||
    //     !BrandingService.banner.hasOwnProperty('message') ) {
    //    return no_banner;
    //};
    var veBannerLink = function(scope) {
        scope.ve_banner = scope.banner.message;
    };


    return {
        templateUrl: template,
        link: veBannerLink
    };
}