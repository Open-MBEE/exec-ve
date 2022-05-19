import * as angular from 'angular';
import _ from 'lodash';
import {veExt} from "@ve-ext";
import {ISpecToolButton} from "@ve-ext/spec-tools";

export interface VeExtensionDescriptor {
    id: string,
    path?: string,
    config?: string
}

export interface VeExtensionConfig {
    specTools?: SpecToolConfig[],
    transclusions?: VeExtensionConfig[]
    presentations?: VeExtensionConfig[]
}

export interface SpecToolConfig  extends VeExtensionConfig {
    name: string,
    button: ISpecToolButton,
    dynamic_button: ISpecToolButton[]
}

export class ExtensionService {

    extensionTags: string[] = []
    extensionData: any[] = []
    allowedExtensions: string[] = ['present', 'transclude', 'spec']

    static $inject = ['growl']
    constructor(private growl: angular.growl.IGrowlService) {
        angular.module('ve-ext')['_invokeQueue'].forEach((value) => {
            if (value[1] === 'component') {
                this.extensionTags.push(_.kebabCase(value[2][0]));
                this.extensionData.push(value[2]);
            }

        });
    }

    public getTagByType(extPrefix: string, type: string): string {
        if (!this.allowedExtensions.includes(extPrefix)) {
            this.growl.error('Unknown Extension Prefix: ' + extPrefix)
            return 'extension-error'
        }
        let tag = _.kebabCase((type.startsWith(extPrefix)) ? type : extPrefix + _.capitalize(type));
        if (!this.extensionTags.includes(tag)) {
            this.growl.error('Unknown Extension type: ' + type)
            return 'extension-error'
        }
        return tag
    }
    
    public getExtensionData() {}

    public getExtensions(extPrefix: string, exclude?: string[]): string[] {
        return this.extensionTags.filter((value) => {
            return (value.startsWith(extPrefix) && ((exclude) ? !exclude.includes(value) : true))
        })
    }

}

veExt.service('ExtensionService', ExtensionService)