import {veUtils} from "@ve-utils";


export interface BrandingStyle {
    labels?: string[] | string[][]
    message?: string | string[]
    separator?: string,
    background?: string,
    color?: string,
    disabled: boolean
    exactText?: boolean
}

export interface BannerStyle extends BrandingStyle {
    top?: boolean,
    bottom?: boolean,
}

/**
 * @ngdoc service
 * @name BrandingService
 *
 * @description
 * Branding Service
 */
export class BrandingService {
    public labels: {[key: string]: string}
    private defaultSeparator: string = ' - ';
    private defaultLabels: {[key: string]: string} = {
                pi: 'PROPRIETARY: Proprietary Information',
                export_ctrl: 'EXPORT WARNING: No export controlled documents allowed on this server',
                no_public_release: 'Not for Public  Release or Redistribution',
                unclassified: 'CLASSIFICATION: This system is UNCLASSIFIED',
                opensource: 'OpenMBEE View Editor | Licensed under Apache 2.0'
            }
            loginBanner: BrandingStyle = {
                labels: [
                    'opensource',
                    'unclassified'
                ],
                disabled: false
            };
            config = this.$window.__env;
            banner: BrandingStyle = {
                labels: ['pi'],
                background: '#0D47A1',
                color: '#e8e8e8',
                disabled: false
            }
            footer: BrandingStyle = {
                labels: ['pi', 'no_public_release'],
                disabled: false
            };

    constructor(private $window) {
        if (this.config.customLabels) {
            this.labels = Object.assign(this.defaultLabels, this.config.customLabels);
        }

        if(this.config.banner) {
            this.banner = Object.assign(this.banner,this.config.banner);
        }
        this.banner = this.createMessage(this.banner);

        if(this.config.loginBanner) {
            this.loginBanner = Object.assign(this.loginBanner,this.config.loginBanner);
        }
        this.loginBanner = this.createMessage(this.loginBanner)
        if(this.config.footer) {
            this.footer = Object.assign(this.footer,this.config.footer);
        }
        this.footer = this.createMessage(this.footer)
    }

    public createMessage = (brandingStyle: BrandingStyle): BrandingStyle => {
        if (brandingStyle.labels) {
            const separator: string = (brandingStyle.separator) ? brandingStyle.separator : this.defaultSeparator;
            brandingStyle.message = []
            if (Array.isArray(brandingStyle.labels[0])) {
                for (const line of brandingStyle.labels) {
                    if (Array.isArray(line)) {
                        brandingStyle.message.push(this._getMessage(line, separator))
                    }
                }
            }else {
                brandingStyle.message.push(this._getMessage(brandingStyle.labels as string[], separator))
            }
        }
        return brandingStyle
    }

    private _getMessage = (labels: string[], separator?:string): string => {
        let msg = "";
        for (const [labelNum, label] of labels.entries()) {
            msg += this._getLabel(label)
            if (labelNum < labels.length-1) {
                msg += separator;
            }
        }
        return msg
    }

    private _getLabel = (labelName: string): string => {
        let msg = ""
        if (this.labels.hasOwnProperty(labelName)) {
            msg = this.labels[labelName];
        }else {
            msg = "Missing Label"
        }
        return msg;
    }

    getBanner() {
        return this.banner;
    }

    getLoginBanner() {
        return this.loginBanner;
    }

    getFooter() {
        return this.footer;
    }
}

BrandingService.$inject = ['$window']

veUtils.service('BrandingService', BrandingService)
