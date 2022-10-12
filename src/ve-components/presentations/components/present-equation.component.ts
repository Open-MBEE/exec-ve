import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-components/presentations";
import {veComponents} from "@ve-components";

let PresentEquationComponent: PresentationComponentOptions = {
    selector: 'presentEquation',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class PresentEquationController implements angular.IComponentController {

        public peObject
        public element
        public peNumber

        constructor() {}
    }
}

veComponents.component(PresentEquationComponent.selector,PresentEquationComponent);
