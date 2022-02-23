import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');


let VeSystemBannerComponent = {
    selector: 'veSystemBanner',
    template: `
    <nav class="nav-level-banner navbar-fixed-top" role="navigation">
    <div class="block">
        <div class="navbar-banner-header">
            {{ $ctrl.banner.message }}
        </div>
    </div>
</nav>    
`,
    bindings: {
        banner: '<'
    },
    controller: class VeSystemBannerController {
        public banner;
    }
};

mmsApp.component(VeSystemBannerComponent.selector,VeSystemBannerComponent);