import angular from 'angular';

var mmsApp = angular.module('mmsApp');

let LoginBannerComponent: angular.ve.ComponentOptions = {
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

mmsApp.component(LoginBannerComponent.selector, LoginBannerComponent);