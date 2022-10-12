import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-components/presentations";
import {veComponents} from "@ve-components";
import {ExpressionObject, PresentationInstanceObject} from "@ve-types/mms";

let PresentListTComponent: PresentationComponentOptions = {
    selector: 'presentListT',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class PresentListTController implements angular.IComponentController {

        public peObject: PresentationInstanceObject
        public element: ExpressionObject
        public peNumber: string

        constructor() {}
    }
}

veComponents.component(PresentListTComponent.selector,PresentListTComponent);
