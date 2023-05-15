import { IComponentController } from 'angular';

import { BrandingStyle } from '@ve-utils/application';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';

const SystemBannerComponent: VeComponentOptions = {
    selector: 'systemBanner',
    template: `
    <nav class="nav-level-banner navbar-fixed-top" role="navigation">
    <div ng-hide="$ctrl.disabled" class="block">
        <div class="navbar-banner-header">
            <div ng-hide="$ctrl.loading" ng-repeat="message in $ctrl.bannerMessage">
                {{ message }}
            </div>
        </div>
    </div>
</nav>    
`,
    bindings: {
        mmsBanner: '<',
    },
    controller: class SystemBannerController implements IComponentController {
        public mmsBanner: BrandingStyle;

        public disabled: boolean;
        public loading: boolean;
        public bannerMessage: string[] = ['Loading...'];

        $onInit(): void {
            this.loading = true;
            if (Array.isArray(this.mmsBanner.message)) this.bannerMessage = this.mmsBanner.message;
            else this.bannerMessage = [this.mmsBanner.message];
            this.disabled = this.mmsBanner.disabled ? this.mmsBanner.disabled : false;
            this.loading = false;
        }
    },
};

veApp.component(SystemBannerComponent.selector, SystemBannerComponent);
