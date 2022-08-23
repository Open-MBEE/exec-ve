import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";
import {veExt} from "@ve-ext";
import {InstanceObject, PresentationInstanceObject} from "@ve-types/mms";

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
        public element: InstanceObject
        public peNumber: string

        constructor() {}
    }
}

veExt.component(PresentListTComponent.selector,PresentListTComponent);