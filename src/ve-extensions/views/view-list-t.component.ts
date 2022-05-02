import * as angular from "angular";
import {VeViewExtensionOptions} from "./view-pe";
import {veExt} from "../ve-extensions.module";

let ViewListTComponent: VeViewExtensionOptions = {
    selector: 'viewListT',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.viewData.source}}"></mms-cf>
`,
    bindings: {
        viewData: '<',
        viewPe: '<'
    },
    controller: class ViewListTController implements angular.IComponentController {

        public viewData
        public viewPe

        constructor() {}
    }
}

veExt.component(ViewListTComponent.selector,ViewListTComponent);