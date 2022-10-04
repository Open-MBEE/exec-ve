import * as angular from "angular";
import {ButtonBarApi, ButtonBarService, IButtonBarButton} from "@ve-utils/button-bar";
import {VeComponentOptions} from "@ve-types/view-editor";
import {veUtils} from "@ve-utils";
import {EventService} from "@ve-utils/core-services";


let ButtonBarComponent: VeComponentOptions = {
    selector: "buttonBar",
    template: `
    <div class="button-bar">
    <span ng-repeat="button in $ctrl.buttons | filter: {permission: true}" >
      <!-- Normal button -->
      <a type="button" ng-if="!button.dropdown_buttons" class="btn btn-tools btn-sm {{button.id}}"
          ng-click="button.action($event)" uib-tooltip="{{button.tooltip}}" tooltip-append-to-body="false"
          tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="{{button.placement}}">
          <span class="fa-stack fa-xl">
            <i ng-show="button.toggle_state" class="fa-solid fa-square fa-stack-2x"></i>
            <i class="{{ button.icon }} fa-stack-1x {{(button.toggle_state) ? 'fa-inverse' : ''}}"></i>
          </span>
          {{button.text}}
      </a>
    
      <!-- Button with dropdown buttons -->
      <span ng-if="button.dropdown_buttons" class="btn-group" uib-dropdown>
        <button type="button" class="btn btn-tools btn-sm dropdown-toggle {{button.id}}" uib-dropdown-toggle uib-tooltip="{{button.tooltip}}"
            tooltip-append-to-body="false" tooltip-trigger="mouseenter" tooltip-popup-delay="100"
            tooltip-placement="{{button.placement}}" on-toggle="$ctrl.bbApi.toggleButtonState(button.id)">
            <i class="{{button.icon}} fa-lg"></i>{{button.button_content}}<i class="{{button.dropdown_icon}} fa-1xs"></i></button>
        <ul class="dropdown-menu" role="menu">
          <li ng-repeat="dropdown_button in button.dropdown_buttons | filter: {permission: true}">
              <a  type="button"
                  class="center {{dropdown_button.id}} {{ dropdown_button.selectable && dropdown_button.selected ? 'checked-list-item' : ''}} {{(!dropdown_button.active) ? 'disabled' : ''}}" 
                  ng-click="dropdown_button.action($event); $ctrl.bbApi.select(button, dropdown_button)">
                  <i class="{{dropdown_button.icon}}"> </i>
                  &nbsp;{{dropdown_button.tooltip}}
              </a>
          </li>
        </ul>
      </span>
    
    </span>
</div>

`,
    bindings: {
        bbApi: "<buttonApi",
        minSize: "<"
    },
    controller: class ButtonBarController implements angular.IComponentController {

        // Bindings
        private bbApi: ButtonBarApi
        private minSize: number = 100;

        public buttons: IButtonBarButton[]
        public dropdownIcon: { [id: string]: string };
        private squished: boolean = false;
        private squishButton: IButtonBarButton;
        private currentHeight: number;
        static $inject = ['$element', 'EventService', 'ButtonBarService']

        constructor(private $element: JQuery<HTMLElement>, private eventSvc: EventService, private buttonBarSvc: ButtonBarService) {
        }

        $onInit() {
            this.squishButton = this.buttonBarSvc.getButtonBarButton('button-bar-menu')
            this.squishButton.dropdown_buttons = this.buttons;
            const observed = this.$element.children().get(0);
            const observer = new ResizeObserver(mutations =>
                mutations.forEach((mutationRecord) => {
                    const size = mutationRecord.borderBoxSize;
                    const oldHeight = this.currentHeight;
                    this.eventSvc.$broadcast(this.bbApi.WRAP_EVENT, { oldSize: oldHeight, newSize: size[0].blockSize });
                    this.currentHeight = size[0].blockSize;
                    if (size[0].inlineSize <= this.minSize && !this.squished) {
                        this.squished = true;
                        this.buttons = [this.squishButton];
                    } else if (size[0].inlineSize > this.minSize && this.squished) {
                        this.squished = false;
                        this.buttons = this.squishButton.dropdown_buttons;
                    }
                })
            );

            observer.observe(observed);
        }

        $doCheck() {
            if (this.bbApi instanceof ButtonBarApi) {
                this.buttons = this.bbApi.buttons;
            }
        }

        public toggleDropdown(id: string) {

        }

    }
}

veUtils.component(ButtonBarComponent.selector, ButtonBarComponent);
