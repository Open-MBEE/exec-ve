import angular, { IComponentController } from 'angular'

import { BrandingStyle } from '@ve-utils/services'
import { handleChange } from '@ve-utils/utils/change.util'

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'

const SystemFooterComponent: VeComponentOptions = {
    selector: 'systemFooter',
    template: `
    <footer ng-show="!$ctrl.footerOb.disabled" class="footer">
    <div class="block">
        <div ng-repeat="message in $ctrl.footerMessage">
                {{ message }}
            </div>
    </div>
</footer>
`,
    bindings: {
        footerOb: '<',
    },
    controller: class FooterController implements IComponentController {
        private footerOb: BrandingStyle

        public footerMessage: string | string[]

        $onInit(): void {
            if (Array.isArray(this.footerOb.message))
                this.footerMessage = this.footerOb.message
            else this.footerMessage = [this.footerOb.message]
        }

        $onChanges(onChangesObj: angular.IOnChangesObject): void {
            handleChange(onChangesObj, 'footerOb', () => {
                this.footerMessage = this.footerOb.message
            })
        }
    },
}

veApp.component(SystemFooterComponent.selector, SystemFooterComponent)
