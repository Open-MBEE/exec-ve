import { Presentation, PresentationService, ViewHtmlService } from '@ve-components/presentations';
import { ComponentService, ExtensionService } from '@ve-components/services';
import { ButtonBarService } from '@ve-core/button-bar';
import { ImageService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VePromise, VeQService } from '@ve-types/angular';
import { IPresentationComponentOptions } from '@ve-types/components/presentation';
import { PresentListObject } from '@ve-types/mms';

class PresentListController extends Presentation {
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

    protected getContent = (): VePromise<string, string> => {
        return this.$q.resolve(this.viewHtmlSvc.makeHtmlList(this.peObject as PresentListObject));
    };
}

const PresentListComponent: IPresentationComponentOptions = {
    selector: 'presentList',
    template: ``,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: PresentListController,
};

veComponents.component(PresentListComponent.selector, PresentListComponent);
