import * as angular from 'angular';
import {handleChange} from "../../lib/changeUtils";
var veApp = angular.module('veApp');

let VeFooterComponent: angular.ve.ComponentOptions = {
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