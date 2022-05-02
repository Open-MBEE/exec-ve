import * as angular from 'angular';
import _ from 'lodash';
import {veExt} from "../ve-extensions.module";

export class ExtensionService {

    extensionTags: string[] = []
    extensionData: any[] = []
    allowedExtensions: string[] = ['view', 'transclude', 'content']

    static $inject = ['growl']
    constructor(private growl: angular.growl.IGrowlService) {
        angular.module('veExt')['_invokeQueue'].forEach((value) => {
            if (value[1] === 'component') {
                this.extensionTags.push(_.kebabCase(value[2][0]));
                this.extensionData.push(value[2]);
            }

        });
    }

    public getTagByType(extPrefix: string, type: string): string {
        if (!this.allowedExtensions.includes(extPrefix)) {
            this.growl.error('Unknown Extension Prefix: ' + extPrefix)
            return 'extensionError'
        }
        let tag = _.kebabCase((type.startsWith(extPrefix)) ? type : extPrefix + type);
        if (!this.extensionTags.includes(tag)) {
            this.growl.error('Unknown Extension type: ' + type)
            return 'extensionError'
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