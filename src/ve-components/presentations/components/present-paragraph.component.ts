import angular, { IComponentController } from 'angular'

import {
    ViewHtmlService,
    Presentation,
    PresentationService,
} from '@ve-components/presentations'
import { ComponentService, ExtensionService } from '@ve-components/services'
import { ButtonBarService } from '@ve-core/button-bar'
import { SchemaService } from '@ve-utils/model-schema'
import { EventService, ImageService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VePromise, VeQService } from '@ve-types/angular'
import { IPresentationComponentOptions } from '@ve-types/components/presentation'
import { PresentTextObject } from '@ve-types/mms'

class PresentParagraph extends Presentation implements IComponentController {
    static $inject = Presentation.$inject
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
        )
    }

    protected getContent = (): VePromise<string, string> => {
        return this.$q.resolve(
            this.viewHtmlSvc.makeHtmlPara(this.peObject as PresentTextObject)
        )
    }
}

const PresentParagraphComponent: IPresentationComponentOptions = {
    selector: 'presentParagraph',
    template: `<div></div>`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentParagraph,
}

veComponents.component(
    PresentParagraphComponent.selector,
    PresentParagraphComponent
)
