import * as angular from 'angular'
var mms = angular.module('mms');

mms.factory('BrandingService', ['$window', BrandingService]);

/**
 * @ngdoc service
 * @name mms.BrandingService
 * 
 * @description
 * Branding Service
 */
function BrandingService($window) {

    var b = {
        label: {
            pi: 'PROPRIETARY: Proprietary Information',
            export_ctrl: 'EXPORT WARNING: No export controlled documents allowed on this server',
            no_public_release: 'Not for Public  Release or Redistribution',
            unclassified: 'CLASSIFICATION: This system is UNCLASSIFIED'
        }
    };

    //b.banner.background = '#0D47A1';
    //b.banner.color      = '#e8e8e8';

    // The banner is optional. It is generated in the mmsApp directive veSystemBanner.
    // If you use a banner, the message field is required. Other fields are optional.
    var banner = {
        message: b.label.pi
    };
    if($window.__env.banner) {
        banner = $window.__env.banner;
    }

    var loginBanner = {
        labels: [
            b.label.unclassified,
            b.label.pi + ' - ' + b.label.no_public_release
        ]
    };
    if($window.__env.loginBanner) {
        loginBanner = $window.__env.loginBanner;
    }

    //b.banner.background = '#0D47A1';
    //b.banner.color      = '#e8e8e8';

    var footer = {
        message: b.label.pi + ' - ' + b.label.no_public_release
    };
    if($window.__env.footer) {
        footer = $window.__env.footer;
    }
    
    // Navigation and URLs 
    //b.veNav_address = 'https://cae-ems-uat.jpl.nasa.gov';

    var getBanner = function() {
        return banner;
    };

    var getLoginBanner = function() {
        return loginBanner;
    };

    var getFooter = function() {
        return footer;
    };
    return {
        getBanner: getBanner,
        getLoginBanner: getLoginBanner,
        getFooter: getFooter
    };
}