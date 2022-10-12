import * as angular from "angular";
import {PresentationComponentOptions, ViewHtmlService} from "@ve-components/presentations";
import {ExpressionObject, PresentationInstanceObject} from "@ve-types/mms";
import {ComponentService} from "@ve-components/services";

import {veComponents} from "@ve-components";
import {ImageService} from "@ve-utils/services";

const PresentListComponent: PresentationComponentOptions = {
    selector: 'presentList',
    template: ``,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class PresentListController implements angular.IComponentController {

        public peObject: PresentationInstanceObject
        public element: ExpressionObject
        public peNumber: string

        constructor(private $element: JQuery<HTMLElement>, private $scope: angular.IScope,
                    private $compile: angular.ICompileService, private viewHtmlSvc: ViewHtmlService, private imageSvc: ImageService) {}

        $onInit() {
            this.$element[0].innerHTML = this.viewHtmlSvc.makeHtmlList(this.peObject);
            $(this.$element[0]).find('img').each((index, element) => {
                this.imageSvc.fixImgSrc($(element));
            });
            this.$compile(this.$element[0].innerHTML)(this.$scope);
        }
    }
}

veComponents.component(PresentListComponent.selector,PresentListComponent);
