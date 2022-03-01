import * as angular from 'angular'
var mms = angular.module('mms');



/**
 * @ngdoc service
 * @name BrandingService
 * 
 * @description
 * Branding Service
 */
class BrandingService {
    private defaultLabels = {
                pi: 'PROPRIETARY: Proprietary Information',
                export_ctrl: 'EXPORT WARNING: No export controlled documents allowed on this server',
                no_public_release: 'Not for Public  Release or Redistribution',
                unclassified: 'CLASSIFICATION: This system is UNCLASSIFIED'
            }
            loginBanner = {
                labels: [
                    this.defaultLabels.unclassified,
                    this.defaultLabels.pi + ' - ' + this.defaultLabels.no_public_release
                ]
            };
            config = this.$window.__env;

    public banner = {
        message: this.defaultLabels.pi,
        background: '#0D47A1',
        color: '#e8e8e8'
    }
    constructor(private $window) {
        if(this.config.banner) {
            this.banner = this.config.banner;
        }

        if(this.config.loginBanner) {
            this.loginBanner = this.config.loginBanner;
        }
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

mms.factory('BrandingService', ['$window', BrandingService]);