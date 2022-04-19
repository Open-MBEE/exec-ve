import * as angular from 'angular';
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
var veApp = angular.module('veApp');


let VeSystemBannerComponent: VeComponentOptions = {
    selector: 'veSystemBanner',
    template: `
    <nav class="nav-level-banner navbar-fixed-top" role="navigation">
    <div class="block">
        <div class="navbar-banner-header">
            {{ $ctrl.banner_message }}
        </div>
    </div>
</nav>    
`,
    bindings: {
        bannerOb: '<'
    },
    controller: class VeSystemBannerController implements angular.IComponentController {
        public bannerOb;

        public banner_message = 'Loading...';
        constructor() {
        }
        $onInit() {
            this.banner_message = this.bannerOb.message;
        }
    }
};

veApp.component(VeSystemBannerComponent.selector,VeSystemBannerComponent);