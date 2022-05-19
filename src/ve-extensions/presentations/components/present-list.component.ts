import * as angular from "angular";
import {PresentationComponentOptions, ViewHtmlService} from "@ve-ext/presentations";
import {veExt, ExtUtilService} from "@ve-ext";

let ViewListComponent: PresentationComponentOptions = {
    selector: 'presentList',
    template: ``,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewListController implements angular.IComponentController {

        public viewData
        public viewPe

        constructor(private $element: JQuery<HTMLElement>, private $scope: angular.IScope,
                    private $compile: angular.ICompileService, private viewHtmlSvc: ViewHtmlService, private extUtilSvc: ExtUtilService) {}

        $onInit() {
            this.$element[0].innerHTML = this.viewHtmlSvc.makeHtmlList(this.viewData);
            $(this.$element[0]).find('img').each((index, element) => {
                this.extUtilSvc.fixImgSrc($(element));
            });
            this.$compile(this.$element[0].innerHTML)(this.$scope);
        }
    }
}

veExt.component(ViewListComponent.selector,ViewListComponent);