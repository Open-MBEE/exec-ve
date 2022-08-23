import angular from 'angular';
import {VeComponentOptions} from "@ve-types/view-editor";

import {veApp} from "@ve-app";

let LoginBannerComponent: VeComponentOptions = {
    selector: 'loginBanner',
    template: `
    <div class="login-banner">
    <div class="login-box login-banner">
        <ul>
            <li ng-repeat="message in $ctrl.message">{{message}}</li>
        </ul>
    </div>
</div>
`,
    bindings: {
        mmsLoginBanner: "<"
    },
    controller: class LoginBannerController implements angular.IComponentController {
        private mmsLoginBanner
        public message
        constructor() {
        }
        $onInit() {
            this.message = this.mmsLoginBanner.message;
        }
    }
}

veApp.component(LoginBannerComponent.selector, LoginBannerComponent);