import * as angular from 'angular';
import {handleChange} from "../../ve-utils/utils/change.util";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
var veApp = angular.module('veApp');

let VeFooterComponent: VeComponentOptions = {
    selector: "veFooter",
    template: `
    <footer class="footer">
    <div class="block">
        <div class="footer">
            {{ $ctrl.footerMessage }}
        </div>
    </div>
</footer>
`,
    bindings: {
        footerOb: "<"
    },
    controller: class FooterController implements angular.IComponentController {
        private footerOb

        public footerMessage

        constructor() {}

        $onChanges(onChangesObj: angular.IOnChangesObject) {
            handleChange(onChangesObj, 'footerOb',() => {
                this.footerMessage = this.footerOb.message;
            })
        }
    }

}


veApp.component(VeFooterComponent.selector,VeFooterComponent);