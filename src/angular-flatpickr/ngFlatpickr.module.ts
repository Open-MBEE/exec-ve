import angular from 'angular';
import * as _flatpickr from 'flatpickr';
import { FlatpickrFn, Instance } from 'flatpickr/dist/types/instance';
const flatpickr: FlatpickrFn = _flatpickr as any;

var ngFlatpickrComponent: angular.ve.ComponentOptions = {
    selector: 'ngFlatpickr',
    template: '<ng-transclude>' +
        '<input type="text" ng-if="!$ctrl.fpOpts.inline" ng-model="$ctrl.ngModel" placeholder="{{ $ctrl.fpOpts.placeholder }}"></input>' +
        '<div ng-if="$ctrl.fpOpts.inline"></div>' +
        '</ng-transclude>',
    transclude: true,
    bindings: {
        ngModel: '<',
        fpOpts: '<',
        fpOnSetup: '&'
    },
    controller: class ngFlatpickrCtrl implements angular.IComponentController {
        static $inject = ['$element', '$timeout', '$scope'];

        //Bindings
        private
            ngModel
            fpOpts
            fpOnSetup

        constructor(private $element: angular.IRootElementService, private $timeout: angular.ITimeoutService,
                    private $scope: angular.IScope) {}

        $onInit()
        {
            this.fpOpts.placeholder = this.fpOpts.placeholder || 'Select Date..';

            this.grabElementAndRunFlatpickr();
        }
        ;

        $onChanges() {
            this.grabElementAndRunFlatpickr();
        };

        grabElementAndRunFlatpickr() {
            this.$timeout(function () {
                var transcludeEl = this.$element.find('ng-transclude')[0];
                var element = transcludeEl.children[0];

                this.setDatepicker(element);
            }, 0, true);
        }

        setDatepicker(element) {
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
            if (this.ngModel) {
                fpInstance.setDate(this.ngModel);
            }

            // destroy the flatpickr instance when the dom element is removed
            angular.element(element).on('$destroy', function () {
                fpInstance.destroy();
            });

            // Refresh the scope
            this.$scope.$applyAsync();
        }
    }
}
    angular
        .module('angular-flatpickr', [])
        .component(ngFlatpickrComponent.selector, ngFlatpickrComponent);
