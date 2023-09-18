import { IComponentController } from 'angular';

import { BrandingStyle } from '@ve-utils/application';
import { handleChange } from '@ve-utils/utils';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';

const LoginBannerComponent: VeComponentOptions = {
    selector: 'loginBanner',
    template: `
    <div class="login-banner">
    <i ng-show="$ctrl.spin" class="fa fa-spin fa-spinner"></i>
    <div ng-hide="$ctrl.spin" class="login-box login-banner">
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
        private mmsLoginBanner: BrandingStyle;
        public message: string[] | string;
        protected spin: boolean = true;

        $onChanges(onChangesObj: angular.IOnChangesObject): void {
            handleChange(onChangesObj, 'mmsLoginBanner', () => {
                if (this.mmsLoginBanner) {
                    this.spin = false;
                    this.message = this.mmsLoginBanner ? this.mmsLoginBanner.message : '';
                } else {
                    this.spin = true;
                    this.message = '';
                }
                if (!Array.isArray(this.message)) {
                    this.message = [this.message];
                }
            });
        }
    },
};

veApp.component(LoginBannerComponent.selector, LoginBannerComponent);
