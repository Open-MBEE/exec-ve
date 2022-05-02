import * as angular from "angular";
import {VeViewExtensionOptions} from "./view-pe";
import {TransclusionService} from "../transclusions/Transclusion.service";
import {ViewHtmlService} from "./ViewHtml.service";
import {veExt} from "../ve-extensions.module";

let ViewListComponent: VeViewExtensionOptions = {
    selector: 'viewList',
    template: ``,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewListController implements angular.IComponentController {

        public viewData
        public viewPe

        constructor(private $element: JQuery<HTMLElement>, private $scope: angular.IScope,
                    private $compile: angular.ICompileService, private viewHtmlSvc: ViewHtmlService, private transclusionSvc: TransclusionService) {}

        $onInit() {
            this.$element[0].innerHTML = this.viewHtmlSvc.makeHtmlList(this.viewData);
            $(this.$element[0]).find('img').each((index, element) => {
                this.transclusionSvc.fixImgSrc($(element));
            });
            this.$compile(this.$element[0].innerHTML)(this.$scope);
        }
    }
}

veExt.component(ViewListComponent.selector,ViewListComponent);