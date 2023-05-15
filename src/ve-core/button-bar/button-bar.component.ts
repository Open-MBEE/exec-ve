import { BarButton, ButtonBarApi, ButtonBarService } from '@ve-core/button-bar';
import { veCoreEvents } from '@ve-core/events';
import { EventService } from '@ve-utils/core';

import { veUtils } from '@ve-utils';

import { VeComponentOptions } from '@ve-types/angular';

const ButtonBarComponent: VeComponentOptions = {
    selector: 'buttonBar',
    template: `
    <div class="button-bar">
    <span ng-repeat="button in $ctrl.buttons | filter: {active: true, permission: true}"  >
      <!-- Normal button -->
      <a type="button" ng-if="button.dropdown_buttons.length === 0" class="btn btn-tools btn-sm {{button.id}} {{ button.permission && !button.locked ? '' : 'disabled' }}"
          ng-click="$ctrl.buttonClicked($event, button)" uib-tooltip="{{button.tooltip}}" tooltip-append-to-body="false"
          tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="{{button.placement}}">
          <span class="fa-stack">
            <i ng-show="button.toggled" class="fa-solid fa-square fa-stack-2x"></i>
            <i class="{{ button.icon }} fa-stack-1x {{(button.toggled) ? 'fa-inverse' : ''}}"></i>
          </span>
          {{button.text}}
      </a>
    
      <!-- Button with dropdown buttons -->
      <span ng-show="button.dropdown_buttons.length > 0" class="btn-group" on-toggle="$ctrl.bbApi.toggleButton(button.id)" uib-dropdown>
        <button type="button" class="btn btn-tools btn-sm dropdown-toggle {{button.id}}" uib-dropdown-toggle uib-tooltip="{{button.tooltip}}"
            tooltip-append-to-body="false" tooltip-trigger="mouseenter" tooltip-popup-delay="100"
            tooltip-placement="{{button.placement}}">
            <i class="{{button.icon}} fa-lg"></i><span class="btn-sm-label">{{button.button_content}}</span><i class="{{button.dropdown_icon}} fa-1xs"></i></button>
        <ul class="dropdown-menu" role="menu">
          <li ng-repeat="dropdown_button in button.dropdown_buttons | filter: {active: true, permission: true}">
              <a  type="button"
                  class="center {{dropdown_button.id}} {{ dropdown_button.selectable && dropdown_button.selected ? 'checked-list-item' : ''}} {{(!dropdown_button.active) ? 'disabled' : ''}}" 
                  ng-click="$ctrl.buttonClicked($event, dropdown_button); $ctrl.bbApi.select(button, dropdown_button)">
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
        buttonId: '<',
        minSize: '<',
    },
    controller: class ButtonBarController implements angular.IComponentController {
        // Bindings
        private buttonId: string;
        private minSize: number = 100;

        private bbApi: ButtonBarApi;
        public init: boolean = false;
        public buttons: BarButton[];
        public dropdownIcon: { [id: string]: string };
        private squished: boolean = false;
        private squishButton: BarButton;
        private currentHeight: number;
        static $inject = ['$element', 'growl', 'EventService', 'ButtonBarService'];

        constructor(
            private $element: JQuery<HTMLElement>,
            private growl: angular.growl.IGrowlService,
            private eventSvc: EventService,
            private buttonBarSvc: ButtonBarService
        ) {}

        $onInit(): void {
            this.buttonBarSvc.waitForApi(this.buttonId).then(
                (api) => {
                    this.bbApi = api;
                    this.buttons = this.bbApi.buttons;
                    this.configure();
                },
                (reason) => {
                    this.growl.error(reason.message);
                }
            );
        }

        configure = (): void => {
            //Setup Squish
            this.squishButton = this.buttonBarSvc.getButtonBarButton('button-bar-menu');
            this.squishButton.dropdown_buttons = this.buttons;
            const observed = this.$element.children().get(0);
            const observer = new ResizeObserver((mutations) =>
                mutations.forEach((mutationRecord) => {
                    const size = mutationRecord.borderBoxSize;
                    const oldHeight = this.currentHeight;
                    this.eventSvc.$broadcast(this.bbApi.WRAP_EVENT, {
                        oldSize: oldHeight,
                        newSize: size[0].blockSize,
                    });
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
        };

        buttonClicked(e: JQuery.ClickEvent, button: BarButton): void {
            if (button.action) {
                button.action(e);
            } else {
                const data: veCoreEvents.buttonClicked = {
                    $event: e,
                    clicked: button.id,
                };
                //Setup fire button-bar click event
                this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.bbApi.id, data);
            }
        }
    },
};

veUtils.component(ButtonBarComponent.selector, ButtonBarComponent);
