import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";
import {veExt} from "@ve-ext";
import {InstanceObject, PresentationInstanceObject} from "@ve-types/mms";

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
        public element: InstanceObject
        public peNumber: string

        constructor() {}
    }
}

veExt.component(PresentImageComponent.selector,PresentImageComponent);