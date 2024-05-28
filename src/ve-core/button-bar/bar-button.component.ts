import { veCoreEvents } from '@ve-core/events';
import { EventService } from '@ve-utils/core';

import { ButtonBarController } from './button-bar.component';

import { VeComponentOptions } from '@ve-types/angular';

export interface IButtonBarButton {
    id: string;
    icon: string;
    tooltip: string;
    placement?: string;
    button_content?: string;
    selectable?: boolean;
    //Toggle Config
    toggle?:
        | {
              icon?: string;
              tooltip?: string;
          }
        | boolean;
    //Dropdown Config
    dropdown?: {
        icon: string;
        toggle_icon: string;
        ids: string[];
    };
    dropdown_buttons?: IButtonBarButton[];
    api?: string;
    enabledFor?: string[];
    disabledFor?: string[];
    type?: string;
    action?: buttonActionFn;
}
export interface buttonActionFn {
    (event?: JQuery.ClickEvent): void;
}
export class BarButton implements angular.IComponentController, IButtonBarButton {
    //Bindings
    config: IButtonBarButton;
    label: boolean;

    className: string;

    //Parents
    $bar: ButtonBarController;
    $parentButton?: BarButton;

    //configs
    id: string;
    icon: string = 'fa-gears';
    tooltip: string = 'Generic Button';
    dropdown_icon: string = '';
    button_content: string = '';
    placement?: string;

    //State
    active: boolean = true;
    selected: boolean = false;
    permission: boolean = true;
    toggled: boolean = false;
    dropdown_toggled: boolean = false;
    spinner: boolean = false;
    locked: boolean = false;

    //Toggle Configuration

    //Set Custom Click actions
    action?: buttonActionFn;

    dropdown_buttons: IButtonBarButton[] = [];

    //Internal
    dropdown_icon_original: string;
    tooltip_original: string;
    icon_original: string;

    appliedClasses: string;
    static $inject = ['EventService'];

    constructor(private eventSvc: EventService) {}

    $onInit(): void {
        if (this.config) {
            Object.assign(this, this.config);
            if (this.config.icon) this.icon = this.icon_original = this.config.icon;

            if (this.config.tooltip) {
                this.tooltip = this.tooltip_original = this.config.tooltip;
            }
            if (this.config.button_content) {
                this.button_content = this.config.button_content;
            }
            if (this.config.dropdown && this.config.dropdown.icon && this.config.dropdown.icon !== '') {
                this.dropdown_icon = this.dropdown_icon_original = this.config.dropdown.icon;
            }
        }
        if (this.className) {
            this.appliedClasses = this.className
                ? this.className
                : `btn btn-tools btn-sm ${this.id} ${this.permission && !this.locked ? '' : 'disabled'}`;
        }
    }

    buttonClicked(e: JQuery.ClickEvent): void {
        if (this.action) {
            this.action(e);
        } else {
            const data: veCoreEvents.buttonClicked = {
                $event: e,
                clicked: this.id,
            };
            //Setup fire button-bar click event
            this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.$bar.getButtonId(), data);
        }
    }

    public handleToggle = (state?: boolean): void => {
        if (this.config.toggle) {
            this.toggled = state != null ? state : !this.toggled;
            if (this.toggled) {
                if ((this.config.toggle as { tooltip: string; icon: string }).tooltip) {
                    this.tooltip = (this.config.toggle as { tooltip: string; icon: string }).tooltip;
                }
                if ((this.config.toggle as { tooltip: string; icon: string }).icon) {
                    this.icon = (this.config.toggle as { tooltip: string; icon: string }).icon;
                }
            } else {
                this.icon = this.icon_original;
                if (this.tooltip_original) {
                    this.tooltip = this.tooltip_original;
                }
            }
        }
        if (this.config.dropdown && this.config.dropdown.icon) {
            this.dropdown_toggled = state != null ? state : !this.dropdown_toggled;
            if (this.dropdown_toggled && this.config.dropdown.toggle_icon) {
                this.dropdown_icon = this.config.dropdown.toggle_icon;
            } else {
                this.dropdown_icon = this.dropdown_icon_original;
            }
        }
    };

    public toggleSpin = (): void => {
        if (this.spinner) {
            if (this.toggled && this.config.toggle) {
                this.icon = (this.config.toggle as { tooltip: string; icon: string }).icon;
            } else {
                this.icon = this.icon_original;
            }
        } else {
            this.icon = 'fa fa-spinner fa-spin';
        }
        this.spinner = !this.spinner;
    };

    public toggleLock = (): void => {
        this.locked = !this.locked;
    };
}

const BarButtonComponent: VeComponentOptions = {
    selector: 'barButton',
    bindings: {
        config: '<',
        className: '@',
        label: '@',
    },
    require: {
        $bar: '^buttonBar',
        $parentButton: '?^barButton',
    },
    template: `
    <!-- Normal button -->
    <span ng-show="$ctrl.dropdown_buttons.length === 0>
        <button class="{{ $ctrl.appliedClasses }}"
                ng-click="$ctrl.buttonClicked($event)" uib-tooltip="{{$ctrl.label ? '' : $ctrl.tooltip }}" tooltip-append-to-body="false"
                tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="{{$ctrl.placement}}">
            <span class="fa-stack">
            <i ng-show="$ctrl.toggled" class="fa-solid fa-square fa-stack-2x"></i>
            <i class="{{ $ctrl.icon }} fa-stack-1x {{($ctrl.toggled) ? 'fa-inverse' : ''}}"></i>
            </span>
            {{$ctrl.label ? $ctrl.text : $ctrl.tooltip}}
        </button>
    </span>
      <!-- Button with dropdown buttons -->
    <span ng-show="$ctrl.dropdown_buttons.length > 0" class="btn-group" on-toggle="$ctrl.handleToggle()" uib-dropdown>
        <button type="button" class="btn btn-tools btn-sm dropdown-toggle {{$ctrl.id}}" uib-dropdown-toggle uib-tooltip="{{$ctrl.tooltip}}"
                tooltip-append-to-body="false" tooltip-trigger="mouseenter" tooltip-popup-delay="100"
                tooltip-placement="{{$ctrl.placement}}">
            <i class="{{$ctrl.icon}} fa-lg"></i><span class="btn-sm-label">{{$ctrl.button_content}}</span><i class="{{$ctrl.dropdown_icon}} fa-1xs"></i></button>
        <div class="dropdown-menu" role="menu">
            <bar-button ng-repeat="dropdown_button in $ctrl.dropdown_buttons | filter: {active: true, permission: true}" config="dropdown_button" class-name="center {{dropdown_button.id}} {{ dropdown_button.selectable && dropdown_button.selected ? 'checked-list-item' : ''}} {{(!dropdown_button.active) ? 'disabled' : ''}}">
        </div>
    </span>
      `,
    controller: BarButton,
};
