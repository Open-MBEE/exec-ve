import * as angular from "angular";
import {VeViewExtensionOptions} from "./view-pe";
import {TransclusionService} from "../transclusions/Transclusion.service";
import {ViewHtmlService} from "./ViewHtml.service";

import {veExt} from "../ve-extensions.module";
import {PresentationElementController} from "./presentation-element.controller";

class ViewParagraph extends PresentationElementController implements angular.IComponentController {

    static $inject = PresentationElementController.$inject
    constructor($element: JQuery<HTMLElement>, $scope: angular.IScope,
                $compile: angular.ICompileService, viewHtmlSvc: ViewHtmlService, transclusionSvc: TransclusionService) {
        super($element, $scope, $compile, viewHtmlSvc, transclusionSvc)
    }

    protected getContent = (): string => this.viewHtmlSvc.makeHtmlPara(this.viewData);


}

let ViewParagraphComponent: VeViewExtensionOptions = {
    selector: 'viewParagraph',
    template: `<div></div>`,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: ViewParagraph

}

veExt.component(ViewParagraphComponent.selector, ViewParagraphComponent);