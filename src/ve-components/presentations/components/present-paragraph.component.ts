import * as angular from "angular";
import {PresentationComponentOptions, ViewHtmlService, Presentation, PresentationService} from "@ve-components/presentations";
import {ComponentService} from "@ve-components/services";
import {veComponents} from "@ve-components";
import {ButtonBarService} from "@ve-core/button-bar";
import {EventService, ImageService} from "@ve-utils/services";
import {SchemaService} from "@ve-utils/model-schema";

class PresentParagraph extends Presentation implements angular.IComponentController {

    static $inject = Presentation.$inject
    constructor($element: JQuery<HTMLElement>, $scope: angular.IScope,
                $compile: angular.ICompileService, growl: angular.growl.IGrowlService, schemaSvc: SchemaService, viewHtmlSvc: ViewHtmlService,
                presentationSvc: PresentationService,  componentSvc: ComponentService, eventSvc: EventService, imageSvc: ImageService, buttonBarSvc: ButtonBarService) {
        super($element, $scope, $compile, growl, schemaSvc, viewHtmlSvc, presentationSvc, componentSvc, eventSvc, imageSvc, buttonBarSvc)
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

veComponents.component(PresentParagraphComponent.selector, PresentParagraphComponent);
