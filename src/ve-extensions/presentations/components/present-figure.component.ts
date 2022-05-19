import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";
import {veExt} from "@ve-ext";

let ViewFigureComponent: PresentationComponentOptions = {
    selector: 'presentFigure',
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