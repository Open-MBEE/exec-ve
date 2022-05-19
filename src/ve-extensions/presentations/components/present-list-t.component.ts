import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";
import {veExt} from "@ve-ext";

let ViewListTComponent: PresentationComponentOptions = {
    selector: 'presentListT',
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