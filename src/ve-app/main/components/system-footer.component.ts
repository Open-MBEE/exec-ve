import { IComponentController } from 'angular';

import { BrandingStyle } from '@ve-utils/application';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';

const SystemFooterComponent: VeComponentOptions = {
    selector: 'systemFooter',
    template: `
    <footer ng-hide="$ctrl.disabled" class="footer">
    <div class="block">
        <div ng-hide="$ctrl.loading" ng-repeat="message in $ctrl.footerMessage">
                {{ message }}
            </div>
    </div>
</footer>
`,
    bindings: {
        mmsFooter: '<',
    },
    controller: class FooterController implements IComponentController {
        private mmsFooter: BrandingStyle;

        public disabled: boolean;
        public loading: boolean;
        public footerMessage: string | string[];

        $onInit(): void {
            this.loading = true;
            if (Array.isArray(this.mmsFooter.message)) this.footerMessage = this.mmsFooter.message;
            else this.footerMessage = [this.mmsFooter.message];
            this.disabled = this.mmsFooter.disabled ? this.mmsFooter.disabled : false;
            this.loading = false;
        }
    },
};

veApp.component(SystemFooterComponent.selector, SystemFooterComponent);
