import * as angular from "angular";
import {PresentationComponentOptions, ViewHtmlService, Presentation, PresentationService} from "@ve-ext/presentations";

import {veExt, ExtUtilService} from "@ve-ext";
import {ButtonBarService} from "@ve-utils/button-bar";
import {EventService} from "@ve-utils/core-services";
import {SchemaService} from "@ve-utils/model-schema";
import {PresentationInstanceObject} from "@ve-types/mms";

class PresentParagraph extends Presentation implements angular.IComponentController {

    static $inject = Presentation.$inject
    constructor($element: JQuery<HTMLElement>, $scope: angular.IScope,
                $compile: angular.ICompileService, growl: angular.growl.IGrowlService, schemaSvc: SchemaService, viewHtmlSvc: ViewHtmlService,
                presentationSvc: PresentationService,  extUtilSvc: ExtUtilService, eventSvc: EventService, buttonBarSvc: ButtonBarService) {
        super($element, $scope, $compile, growl, schemaSvc, viewHtmlSvc, presentationSvc, extUtilSvc, eventSvc, buttonBarSvc)
    }

    protected getContent = (): string => this.viewHtmlSvc.makeHtmlPara(this.peObject);


}

let PresentParagraphComponent: PresentationComponentOptions = {
    selector: 'presentParagraph',
    template: `<div></div>`,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: PresentParagraph

}

veExt.component(PresentParagraphComponent.selector, PresentParagraphComponent);
