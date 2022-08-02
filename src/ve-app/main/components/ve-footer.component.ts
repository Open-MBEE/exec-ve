import * as angular from 'angular';
import {handleChange} from "@ve-utils/utils/change.util";
import {VeComponentOptions} from "@ve-types/view-editor";

import {veApp} from "@ve-app";

let VeFooterComponent: VeComponentOptions = {
    selector: "veFooter",
    template: `
    <footer ng-show="!$ctrl.footerOb.disabled" class="footer">
    <div class="block">
        <div ng-repeat="message in $ctrl.footerMessage">
                {{ message }}
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

        $onInit() {
            if (Array.isArray(this.footerOb.message))
                this.footerMessage = this.footerOb.message;
            else
                this.footerMessage = [this.footerOb.message];
        }

        $onChanges(onChangesObj: angular.IOnChangesObject) {
            handleChange(onChangesObj, 'footerOb',() => {
                this.footerMessage = this.footerOb.message;
            })
        }
    }

}


veApp.component(VeFooterComponent.selector,VeFooterComponent);