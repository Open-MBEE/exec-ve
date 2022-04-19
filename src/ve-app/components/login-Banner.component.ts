import angular from 'angular';
import {VeComponentOptions} from "../../ve-utils/types/view-editor";

var veApp = angular.module('veApp');

let LoginBannerComponent: VeComponentOptions = {
    selector: 'loginBanner',
    template: `
    <div class="login-banner">
    <div class="login-box login-banner">
        <ul>
            <li ng-repeat="label in $ctrl.labels">{{label}}</li>
        </ul>
    </div>
</div>
`,
    bindings: {
        mmsLoginBanner: "<"
    },
    controller: class LoginBannerController implements angular.IComponentController {
        private mmsLoginBanner
        public labels
        constructor() {
        }
        $onInit() {
            this.labels = this.mmsLoginBanner.labels;
        }
    }
}

veApp.component(LoginBannerComponent.selector, LoginBannerComponent);