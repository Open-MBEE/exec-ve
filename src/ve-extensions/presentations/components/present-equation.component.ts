import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";
import {veExt} from "@ve-ext";

let ViewEquationComponent: PresentationComponentOptions = {
    selector: 'presentEquation',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.viewData.source}}"></mms-cf>
`,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewEquationController implements angular.IComponentController {

        public viewData
        public viewPe

        constructor() {}
    }
}

veExt.component(ViewEquationComponent.selector,ViewEquationComponent);