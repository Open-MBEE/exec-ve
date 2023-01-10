import angular from 'angular'

import {
    Presentation,
    PresentationService,
    ViewHtmlService,
} from '@ve-components/presentations'
import { ComponentService } from '@ve-components/services'
import { ButtonBarService } from '@ve-core/button-bar'
import { SchemaService } from '@ve-utils/model-schema'
import { EventService, ImageService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { ComponentController } from '@ve-types/components'
import { IPresentationComponentOptions } from '@ve-types/components/presentation'
import { PresentContentObject } from '@ve-types/mms'

export interface PresentPlotObject extends PresentContentObject {
    ptype?: string
    config?: string
    [key: string]: unknown
}

const ViewPlotComponent: IPresentationComponentOptions = {
    selector: 'presentPlot',
    template: ``,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: class ViewPlotController
        extends Presentation
        implements ComponentController
    {
        public plot: PresentPlotObject
        public plotConfig: PresentPlotObject

        static $inject = Presentation.$inject
        constructor(
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
            buttonBarSvc: ButtonBarService
        ) {
            super(
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
                buttonBarSvc
            )
        }

        config = (): void => {
            this.plot = this.peObject as PresentPlotObject
        }

        getContent = (): string => {
            if (this.plot.type === 'Plot') {
                if (
                    this.plot.config !== undefined &&
                    this.plot.config.trim().length !== 0
                ) {
                    try {
                        this.plotConfig = JSON.parse(
                            this.plot.config.replace(/'/g, '"')
                        ) as PresentPlotObject
                        if (this.plotConfig.ptype !== undefined) {
                            this.plot.ptype = this.plotConfig.ptype
                        }
                    } catch (err) {
                        console.log('error ignored')
                    }
                }
                return `<figure><plot-${this.plot.ptype} plot="plot"></plot-${this.plot.ptype}><figcaption>{{$ctrl.plot.title}}</figcaption></figure>`
            }
        }
    },
}

veComponents.component(ViewPlotComponent.selector, ViewPlotComponent)
