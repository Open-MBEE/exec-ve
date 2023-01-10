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

import { IPresentationComponentOptions } from '@ve-types/components/presentation'
import { PresentListObject } from '@ve-types/mms'

class PresentListController extends Presentation {
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

    protected getContent = (): string => {
        return this.viewHtmlSvc.makeHtmlList(this.peObject as PresentListObject)
    }
}

const PresentListComponent: IPresentationComponentOptions = {
    selector: 'presentList',
    template: ``,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentListController,
}

veComponents.component(PresentListComponent.selector, PresentListComponent)
