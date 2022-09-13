import * as angular from "angular";
import {PresentationComponentOptions} from "@ve-ext/presentations";
import {veExt} from "@ve-ext";
import {ExpressionObject, PresentationInstanceObject} from "@ve-types/mms";

let PresentFigureComponent: PresentationComponentOptions = {
    selector: 'presentFigure',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
       peObject: '<',
        element: '<',
        peNumber: '<'
    },
    controller: class PresentFigureController implements angular.IComponentController {

        public peObject: PresentationInstanceObject
        public element: ExpressionObject
        public peNumber: string

        constructor() {}
    }
}

veExt.component(PresentFigureComponent.selector,PresentFigureComponent);
