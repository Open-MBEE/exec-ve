import angular, { IComponentController } from 'angular';
import flatpickr from 'flatpickr';

import { VeComponentOptions } from '@ve-types/angular';

export interface ngFlatpickrOptions extends flatpickr.Options.Options {
    placeholder: string;
}

export type ngFlatpickrCallback = (fpInstance: flatpickr.Instance) => void;

const ngFlatpickrComponent: VeComponentOptions = {
    selector: 'ngFlatpickr',
    template: `
    <ng-transclude>
    <input type="text" ng-show="!$ctrl.fpOpts.inline" ng-model="$ctrl.inputDate" placeholder="{{ $ctrl.fpOpts.placeholder }}">
    <div ng-show="$ctrl.fpOpts.inline"></div>
</ng-transclude>
`,
    transclude: true,
    bindings: {
        fpOpts: '<',
        fpOnSetup: '&',
    },
    controller: class ngFlatpickrCtrl implements IComponentController {
        static $inject = ['$element', '$timeout', '$scope'];

        //Bindings
        private fpOpts: ngFlatpickrOptions;
        private fpOnSetup: ngFlatpickrCallback;

        private inputDate: number;

        constructor(private $element: JQuery<HTMLElement>, private $timeout: angular.ITimeoutService) {}

        $onInit(): void {
            this.fpOpts.placeholder = this.fpOpts.placeholder || 'Select Date..';
        }

        $postLink(): void {
            this.grabElementAndRunFlatpickr();
        }

        $onChanges(): void {
            this.grabElementAndRunFlatpickr();
        }

        grabElementAndRunFlatpickr = (): void => {
            void this.$timeout(
                () => {
                    const transcludeEl = this.$element.find('ng-transclude')[0];
                    const element = transcludeEl.children[0];

                    this.setDatepicker(element);
                },
                0,
                true
            );
        };

        setDatepicker = (element: Element): void => {
            if (!flatpickr) {
                return console.warn('Unable to find any flatpickr installation');
            }

            const fpInstance: flatpickr.Instance = flatpickr(element, this.fpOpts);

            if (this.fpOnSetup) {
                this.fpOnSetup(fpInstance);
            }

            // If has ngModel set the date
            if (this.inputDate) {
                fpInstance.setDate(this.inputDate);
            }

            // destroy the flatpickr instance when the dom element is removed
            angular.element(element).on('$destroy', () => {
                fpInstance.destroy();
            });
        };
    },
};
angular.module('angular-flatpickr', []).component(ngFlatpickrComponent.selector, ngFlatpickrComponent);
