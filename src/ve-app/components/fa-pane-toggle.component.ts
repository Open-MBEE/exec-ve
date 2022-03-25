import * as angular from 'angular';

var veUtils = angular.module('veUtils');

let FaPaneToggleComponent: angular.ve.ComponentOptions = {
    selector: "faPaneToggle",
    transclude: true,
    controller: class FaPaneToggleController implements angular.IComponentController {
        static $inject = ['$attrs']
        constructor(private $attrs: angular.IAttributes) {
        }
        $onInit() {
            this.$attrs.$observe("faPaneToggle", (paneId) => {});
        }
    }
}

veUtils.component(FaPaneToggleComponent.selector,FaPaneToggleComponent);