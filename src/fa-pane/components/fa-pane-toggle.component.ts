import * as angular from 'angular';
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {faPaneModule} from "../fa-pane.main";

let FaPaneToggleComponent: VeComponentOptions = {
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

faPaneModule.component(FaPaneToggleComponent.selector,FaPaneToggleComponent);