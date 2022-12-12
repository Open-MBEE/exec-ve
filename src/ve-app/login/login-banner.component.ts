import angular, { IComponentController } from 'angular'

import { BrandingStyle } from '@ve-utils/services'

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'

const LoginBannerComponent: VeComponentOptions = {
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
        mmsLoginBanner: '<',
    },
    controller: class LoginBannerController implements IComponentController {
        private mmsLoginBanner: BrandingStyle
        public message: string[] | string

        $onInit(): void {
            this.message = this.mmsLoginBanner.message
            if (!Array.isArray(this.message)) {
                this.message = [this.message]
            }
        }
    },
}

veApp.component(LoginBannerComponent.selector, LoginBannerComponent)
