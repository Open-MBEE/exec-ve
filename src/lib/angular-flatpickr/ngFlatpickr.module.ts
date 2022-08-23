import angular from 'angular';
import * as _flatpickr from 'flatpickr';
import { FlatpickrFn, Instance } from 'flatpickr/dist/types/instance';
import { VeComponentOptions } from 'src/ve-utils/types/view-editor';
const flatpickr: FlatpickrFn = _flatpickr.default;

var ngFlatpickrComponent: VeComponentOptions = {
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
        fpOnSetup: '&'
    },
    controller: class ngFlatpickrCtrl implements angular.IComponentController {
        static $inject = ['$element', '$timeout', '$scope'];

        //Bindings
        private fpOpts
        private fpOnSetup

        private inputDate

        constructor(private $element: JQuery<HTMLElement>, private $timeout: angular.ITimeoutService,
                    private $scope: angular.IScope) {}

        $onInit()
        {
            this.fpOpts.placeholder = this.fpOpts.placeholder || 'Select Date..';
        }

        $postLink() {
            this.grabElementAndRunFlatpickr();
        }

        $onChanges() {
            this.grabElementAndRunFlatpickr();
        };

        grabElementAndRunFlatpickr = () => {
            this.$timeout(() => {
                var transcludeEl = this.$element.find('ng-transclude')[0];
                var element = transcludeEl.children[0];

                this.setDatepicker(element);
            }, 0, true);
        }

        setDatepicker = (element) => {
            var fpLib = flatpickr;

            if (!fpLib) {
                return console.warn('Unable to find any flatpickr installation');
            }

            var fpInstance: Instance = fpLib(element, this.fpOpts);

            if (this.fpOnSetup) {
                this.fpOnSetup({
                    fpItem: fpInstance
                });
            }

            // If has ngModel set the date
            if (this.inputDate) {
                fpInstance.setDate(this.inputDate);
            }

            // destroy the flatpickr instance when the dom element is removed
            angular.element(element).on('$destroy', () => {
                fpInstance.destroy();
            });

            // Refresh the scope
            //this.$scope.$applyAsync();
        }
    }
}
    angular
        .module('angular-flatpickr', [])
        .component(ngFlatpickrComponent.selector, ngFlatpickrComponent);
