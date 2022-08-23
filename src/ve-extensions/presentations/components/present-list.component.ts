import * as angular from "angular";
import {PresentationComponentOptions, ViewHtmlService} from "@ve-ext/presentations";
import {veExt, ExtUtilService} from "@ve-ext";
import {InstanceObject, PresentationInstanceObject} from "@ve-types/mms";

let PresentListComponent: PresentationComponentOptions = {
    selector: 'presentList',
    template: ``,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class PresentListController implements angular.IComponentController {

        public peObject: PresentationInstanceObject
        public element: InstanceObject
        public peNumber: string

        constructor(private $element: JQuery<HTMLElement>, private $scope: angular.IScope,
                    private $compile: angular.ICompileService, private viewHtmlSvc: ViewHtmlService, private extUtilSvc: ExtUtilService) {}

        $onInit() {
            this.$element[0].innerHTML = this.viewHtmlSvc.makeHtmlList(this.peObject);
            $(this.$element[0]).find('img').each((index, element) => {
                this.extUtilSvc.fixImgSrc($(element));
            });
            this.$compile(this.$element[0].innerHTML)(this.$scope);
        }
    }
}

veExt.component(PresentListComponent.selector,PresentListComponent);