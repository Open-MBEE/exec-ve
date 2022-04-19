import * as angular from "angular";
import {VeViewExtensionOptions} from "../ve-extensions";
import {veExt} from "../ve-extensions.module";

let ViewEquationComponent: VeViewExtensionOptions = {
    selector: 'viewEquation',
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