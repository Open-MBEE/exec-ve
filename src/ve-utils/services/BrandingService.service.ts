import * as angular from 'angular'
var veUtils = angular.module('veUtils');



/**
 * @ngdoc service
 * @name BrandingService
 * 
 * @description
 * Branding Service
 */
export class BrandingService {
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
            banner = {
                message: this.defaultLabels.pi,
                background: '#0D47A1',
                color: '#e8e8e8'
            }
            footer = {
                message: this.defaultLabels.pi + ' - ' + this.defaultLabels.no_public_release
            };

    constructor(private $window) {
        if(this.config.banner) {
            this.banner = this.config.banner;
        }

        if(this.config.loginBanner) {
            this.loginBanner = this.config.loginBanner;
        }
        if(this.config.footer) {
            this.footer = this.config.footer;
        }
    }

    getBanner() {
        return this.banner;
    };

    getLoginBanner() {
        return this.loginBanner;
    };

    getFooter() {
        return this.footer;
    };
}

BrandingService.$inject = ['$window']

veUtils.service('BrandingService', BrandingService)