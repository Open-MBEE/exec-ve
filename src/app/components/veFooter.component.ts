import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');

let VeFooterComponent = {
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
    controller: class FooterController {
        public footer

        constructor() {}

    }

}


mmsApp.component(VeFooterComponent.selector,VeFooterComponent);