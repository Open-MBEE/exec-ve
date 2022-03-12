import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');

let VeFooterComponent: angular.ve.ComponentOptions = {
    selector: "veFooter",
    template: `
    <footer class="footer">
    <div class="block">
        <div class="footer">
            {{ $ctrl.footer.message }}
        </div>
    </div>
</footer>
`,
    bindings: {
        footer: "<"
    },
    controller: class FooterController implements angular.IComponentController {
        public footer

        constructor() {}

    }

}


mmsApp.component(VeFooterComponent.selector,VeFooterComponent);