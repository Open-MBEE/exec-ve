import * as angular from "angular";
import {VeViewExtensionOptions} from "../ve-extensions";
import {veExt} from "../ve-extensions.module";

let ViewFigureComponent: VeViewExtensionOptions = {
    selector: 'viewFigure',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.viewData.source}}"></mms-cf>
`,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewFigureController implements angular.IComponentController {

        public viewData
        public viewPe

        constructor() {}
    }
}

veExt.component(ViewFigureComponent.selector,ViewFigureComponent);