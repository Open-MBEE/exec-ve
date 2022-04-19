import * as angular from 'angular';
import _ from 'lodash';
import {ElementObject} from "../../ve-utils/types/mms";
import {veExt} from "../ve-extensions.module";

export class ViewExtService {

    viewsList: string[] = []

    static $inject = ['growl']
    constructor(private growl: angular.growl.IGrowlService) {
        angular.module('veExt')['_invokeQueue'].forEach((value) => {
            if (value[1] === 'component') {
                this.viewsList.push(_.kebabCase(value[2][0]));
            }

        });
    }

    public getTypeTag(pe: ElementObject): string {
        let tag = _.kebabCase("view" + pe.type);
        if (!this.viewsList.includes(tag)) {
            this.growl.error('Unknown view type: ' + pe.type)
            return 'error'
        }
        return tag
    }

}

veExt.service('ViewExtService', ViewExtService)