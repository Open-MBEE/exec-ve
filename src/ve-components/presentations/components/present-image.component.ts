import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-components/presentations";
import {veComponents} from "@ve-components";
import {ExpressionObject, PresentationInstanceObject} from "@ve-types/mms";

let PresentImageComponent: PresentationComponentOptions = {
    selector: 'presentImage',
    template: `
    <figure>
    <mms-cf mms-cf-type="img" mms-element-id="{{$ctrl.peObject.id}}"></mms-cf>
    <figcaption>
        <span ng-if="!$ctrl.peObject.excludeFromList">Figure {{$ctrl.peNumber}}. 
        </span>{{$ctrl.peObject.title || $ctrl.element.name}}
    </figcaption>
</figure>
`,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class PresentImageController implements angular.IComponentController {

        public peObject: PresentationInstanceObject
        public element: ExpressionObject
        public peNumber: string

        constructor() {}
    }
}

veComponents.component(PresentImageComponent.selector,PresentImageComponent);
