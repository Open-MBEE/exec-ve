import * as angular from "angular";
import {PresentationComponentOptions, ViewHtmlService, PresentationElementController} from "@ve-ext/presentations";

import {veExt, ExtUtilService} from "@ve-ext";

class ViewParagraph extends PresentationElementController implements angular.IComponentController {

    static $inject = PresentationElementController.$inject
    constructor($element: JQuery<HTMLElement>, $scope: angular.IScope,
                $compile: angular.ICompileService, viewHtmlSvc: ViewHtmlService, extUtilSvc: ExtUtilService) {
        super($element, $scope, $compile, viewHtmlSvc, extUtilSvc)
    }

    protected getContent = (): string => this.viewHtmlSvc.makeHtmlPara(this.viewData);


}

let ViewParagraphComponent: PresentationComponentOptions = {
    selector: 'presentParagraph',
    template: `<div></div>`,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: ViewParagraph

}

veExt.component(ViewParagraphComponent.selector, ViewParagraphComponent);