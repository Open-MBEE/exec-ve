import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";
import {veExt} from "@ve-ext";

let ViewImageComponent: PresentationComponentOptions = {
    selector: 'presentImage',
    template: `
    <figure>
    <mms-cf mms-cf-type="img" mms-element-id="{{$ctrl.viewData.id}}"></mms-cf>
    <figcaption>
        <span ng-if="!$ctrl.viewData.excludeFromList">Figure {{$ctrl.viewPe._veNumber}}. 
        </span>{{$ctrl.viewData.title || $ctrl.viewPe.name}}
    </figcaption>
</figure>
`,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewImageController implements angular.IComponentController {

        public viewData
        public viewPe

        constructor() {}
    }
}

veExt.component(ViewImageComponent.selector,ViewImageComponent);