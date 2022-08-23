import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";

import {veExt} from "@ve-ext";


let PresentTableTComponent: PresentationComponentOptions = {
    selector: 'presentTableT',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class PresentTableTController implements angular.IComponentController {

        public peObject
        public element
        public peNumber

        constructor() {}
    }
}

veExt.component(PresentTableTComponent.selector,PresentTableTComponent);