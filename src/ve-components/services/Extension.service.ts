import angular from 'angular';
import _ from 'lodash';

import { IButtonBarButton } from '@ve-core/button-bar';
import { IToolBarButton } from '@ve-core/toolbar';

import { veComponents } from '@ve-components';

export interface VeExperimentDescriptor {
    id: string;
    path?: string;
    config?: string;
    name?: string;
    toolButton?: IToolBarButton;
    toolDynamicButton?: IToolBarButton[];
    barButtons?: IButtonBarButton[];
}

export interface VeExperimentConfig {
    [extensionType: string]: VeExperimentDescriptor[];
}

export class ExtensionService {
    extensionTags: string[] = [];
    extensionData: unknown[] = [];
    allowedExtensions: string[] = ['present', 'transclude', 'spec', 'insert', 'tree-of'];

    public AnnotationType = {
        transcludeName: 1,
        transcludeDoc: 2,
        transcludeCom: 3,
        transcludeVal: 4,
        mmsViewLink: 5,
        presentationElement: 6,
        transcludeView: 7,
    };

    static $inject = [];
    constructor() {
        (
            angular.module('ve-components')['_invokeQueue'] as {
                1: string;
                2: string[];
            }[]
        ).forEach((value) => {
            if (value[1] === 'component') {
                this.extensionTags.push(_.kebabCase(value[2][0]));
                this.extensionData.push(value[2]);
            }
        });

        // for (const tag of this.extensionTags) {
        //
        // }
    }

    public getTagByType = (extPrefix: string, type: string): string => {
        extPrefix = _.kebabCase(extPrefix);
        if (!this.allowedExtensions.includes(extPrefix)) {
            // this.growl.error('Unknown Extension Prefix: ' + extPrefix)
            return 'extension-error';
        }
        if (type == 'InstanceSpecification') type = 'section';
        if (type == 'ImageT') type = 'figure';
        const tag = _.kebabCase(type.startsWith(extPrefix) ? type : extPrefix + _.capitalize(type));
        if (!this.extensionTags.includes(tag)) {
            // this.growl.error('Unknown Extension type: ' + type)
            return 'extension-error';
        }
        return tag;
    };

    public getExtensions(extPrefix: string, exclude?: string[]): string[] {
        return this.extensionTags.filter((value) => {
            return value.startsWith(_.kebabCase(extPrefix)) && (exclude ? !exclude.includes(value) : true);
        });
    }
}

veComponents.service('ExtensionService', ExtensionService);
