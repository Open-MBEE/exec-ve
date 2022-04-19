import * as angular from "angular";
import {VeViewExtensionOptions} from "../ve-extensions";
import {Utils} from "../../ve-core/utilities/Utils.service";
import {ViewHtmlService} from "./ViewHtml.service";

import {veExt} from "../ve-extensions.module";
import {PresentationElementController} from "./presentation-element.controller";

class ViewParagraph extends PresentationElementController implements angular.IComponentController {

    static $inject = ['$element', '$scope', '$compile', 'ViewHtmlService', 'Utils']
    constructor($element: angular.IRootElementService, $scope: angular.IScope,
                $compile: angular.ICompileService, viewHtmlSvc: ViewHtmlService, utils: Utils) {
        super($element, $scope, $compile, viewHtmlSvc, utils)
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