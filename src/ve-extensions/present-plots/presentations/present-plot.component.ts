import angular from 'angular';

import { Presentation, PresentationService, ViewHtmlService } from '@ve-components/presentations';
import { ComponentService, ExtensionService } from '@ve-components/services';
import { ButtonBarService } from '@ve-core/button-bar';
import { ImageService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VePromise, VeQService } from '@ve-types/angular';
import { IPresentationComponentOptions } from '@ve-types/components/presentation';
import { PresentContentObject } from '@ve-types/mms';

export interface PresentPlotObject extends PresentContentObject {
    ptype?: string;
    config?: string;
    [key: string]: unknown;
}

const ViewPlotComponent: IPresentationComponentOptions = {
    selector: 'presentPlot',
    template: ``,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: class ViewPlotController extends Presentation {
        public plot: PresentPlotObject;
        public plotConfig: PresentPlotObject;

        static $inject = Presentation.$inject;
        constructor(
            $q: VeQService,
            $element: JQuery<HTMLElement>,
            $scope: angular.IScope,
            $compile: angular.ICompileService,
            growl: angular.growl.IGrowlService,
            schemaSvc: SchemaService,
            viewHtmlSvc: ViewHtmlService,
            presentationSvc: PresentationService,
            componentSvc: ComponentService,
            eventSvc: EventService,
            imageSvc: ImageService,
            buttonBarSvc: ButtonBarService,
            extensionSvc: ExtensionService
        ) {
            super(
                $q,
                $element,
                $scope,
                $compile,
                growl,
                schemaSvc,
                viewHtmlSvc,
                presentationSvc,
                componentSvc,
                eventSvc,
                imageSvc,
                buttonBarSvc,
                extensionSvc
            );
        }

        config = (): void => {
            this.plot = this.peObject as PresentPlotObject;
        };

        getContent = (): VePromise<string, string> => {
            if (this.plot.type === 'Plot') {
                if (this.plot.config !== undefined && this.plot.config.trim().length !== 0) {
                    try {
                        this.plotConfig = JSON.parse(this.plot.config.replace(/'/g, '"')) as PresentPlotObject;
                        if (this.plotConfig.ptype !== undefined) {
                            this.plot.ptype = this.plotConfig.ptype;
                        }
                    } catch (err) {
                        console.log('error ignored');
                    }
                }
                return this.$q.resolve(
                    `<figure><plot-${this.plot.ptype} plot="plot"></plot-${this.plot.ptype}><figcaption>{{$ctrl.plot.title}}</figcaption></figure>`
                );
            }
        };
    },
};

veComponents.component(ViewPlotComponent.selector, ViewPlotComponent);
