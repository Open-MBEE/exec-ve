import * as angular from 'angular';
import {VeComponentOptions} from "@ve-types/view-editor";
import {BrandingStyle} from "@ve-utils/core-services";

import {veApp} from "@ve-app";


let VeSystemBannerComponent: VeComponentOptions = {
    selector: 'veSystemBanner',
    template: `
    <nav class="nav-level-banner navbar-fixed-top" role="navigation">
    <div ng-show="!$ctrl.bannerOb.disabled" class="block">
        <div class="navbar-banner-header">
            <div ng-repeat="message in $ctrl.bannerMessage">
                {{ message }}
            </div>
        </div>
    </div>
</nav>    
`,
    bindings: {
        bannerOb: '<'
    },
    controller: class VeSystemBannerController implements angular.IComponentController {
        public bannerOb: BrandingStyle;

        public bannerMessage: string[] = ['Loading...'];

        $onInit() {
            if (Array.isArray(this.bannerOb.message))
                this.bannerMessage = this.bannerOb.message;
            else
                this.bannerMessage = [this.bannerOb.message];
        }
    }
};

veApp.component(VeSystemBannerComponent.selector,VeSystemBannerComponent);