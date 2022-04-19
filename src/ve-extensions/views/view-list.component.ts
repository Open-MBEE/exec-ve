import * as angular from "angular";
import {VeViewExtensionOptions} from "../ve-extensions";
import {Utils} from "../../ve-core/utilities/Utils.service";
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

        constructor(private $element: angular.IRootElementService, private $scope: angular.IScope,
                    private $compile: angular.ICompileService, private viewHtmlSvc: ViewHtmlService, private utils: Utils) {}

        $onInit() {
            this.$element[0].innerHTML = this.viewHtmlSvc.makeHtmlList(this.viewData);
            $(this.$element[0]).find('img').each((index, element) => {
                this.utils.fixImgSrc($(element));
            });
            this.$compile(this.$element[0].innerHTML)(this.$scope);
        }
    }
}

veExt.component(ViewListComponent.selector,ViewListComponent);