import * as angular from "angular";
import {VeViewExtensionOptions} from "./view-pe";
import {veExt} from "../ve-extensions.module";

let ViewTableTComponent: VeViewExtensionOptions = {
    selector: 'viewTableT',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.viewData.source}}"></mms-cf>
`,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewTableTController implements angular.IComponentController {

        public viewData
        public viewPe

        constructor() {}
    }
}

veExt.component(ViewTableTComponent.selector,ViewTableTComponent);