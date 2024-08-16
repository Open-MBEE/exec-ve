import { veCoreEvents } from '@ve-core/events';
import { veCore } from '@ve-core/ve-core.module';
import { EventService } from '@ve-utils/core';

import { ButtonBarController } from './button-bar.component';
import { ButtonBarService } from './services/ButtonBar.service';

import { VeComponentOptions } from '@ve-types/angular';

export interface IButtonBarButton {
    buttonId: string;
    icon: string;
    title?: string;
    tooltip: string;
    placement?: string;
    selectable?: boolean;
    //Toggle Config
    toggleable?: boolean;
    toggleEvent?: string;
    toggledTooltip?: string;
    //Spin Config
    spinnable?: boolean;
    spinEvent?: string;
    //Dropdown Config
    disableCaret?: boolean;
    dropdownIds?: string[];
    //dropdown_buttons?: IButtonBarButton[];
    api?: string;
    enabledFor?: string[];
    disabledFor?: string[];
    //type?: string;
    //action?: buttonActionFn;
    className?: string;
    label?: boolean;
    activationCb?: (state: { state: string }) => boolean;

    templateUrl?: string;
}
export interface buttonActionFn {
    (event: { e?: JQuery.ClickEvent }): void;
}
export class BarButton implements angular.IComponentController, IButtonBarButton {
    //Bindings
    buttonId: string;
    icon: string = 'fa-gears';
    tooltip: string = 'Generic Button';
    disableCaret: boolean;
    dropdownIds: string[] = [];
    dropdownButtons: IButtonBarButton[] = [];
    buttons: { [id: string]: BarButton } = {};
    //Defaults
    caretIcon: string = 'fa-solid fa-caret-down';

    orientation: string = '';
    placement?: string;

    label: boolean = false;
    title: string = '';

    toggleable: boolean;
    toggleEvent?: string;
    toggledTooltip?: string;
    toggledCaret: string = 'fa-solid fa-caret-up';

    spinnable?: boolean;
    spinEvent?: string;

    selectable?: boolean;

    templateUrl?: string;

    className: string;

    enabledFor?: string[];
    disabledFor?: string[];

    //Parents
    $bar: ButtonBarController;
    $parentButton?: BarButton;

    activationCb: (state: { state: string }) => boolean;

    //State
    private active: boolean = true;
    private selected: boolean = false;
    private permission: boolean = true;
    private toggled: boolean = false;
    private spin: boolean = false;
    private locked: boolean = false;

    //Toggle Configuration

    //Set Custom Click actions
    //action?: buttonActionFn;

    //Internal
    private tooltipOriginal: string;
    private iconOriginal: string;
    private caretIconOriginal: string;
    private $resizer: ResizeObserver;
    public width: number = 0;

    subs: Rx.Disposable[];

    appliedClasses: string;
    static $inject = ['$element', 'EventService', 'ButtonBarService'];

    constructor(
        public $element: JQuery<HTMLElement>,
        private eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.iconOriginal = this.icon;
        this.tooltipOriginal = this.tooltip;
        this.caretIconOriginal = this.caretIcon;

        this.appliedClasses = `btn btn-tools${this.$bar.squished ? '' : ' btn-sm'}${
            this.className ? ' ' + this.className : ''
        }${this.permission && !this.locked ? '' : ' disabled'}
        `;

        if (this.dropdownIds && this.dropdownIds.length > 0) {
            this.dropdownIds.forEach((dropdownId) => {
                this.dropdownButtons.push(this.buttonBarSvc.getButtonDefinition(dropdownId));
            });
        }

        this.checkActive();

        this.eventSvc.$init(this);
        if (this.toggleEvent) {
            this.subs.push(
                this.eventSvc.binding<boolean>(this.toggleEvent, (state) => {
                    this.handleToggle(state);
                })
            );
        }
        if (this.spinEvent) {
            this.subs.push(
                this.eventSvc.binding<boolean>(this.spinEvent, (state) => {
                    this.handleSpin(state);
                })
            );
        }
    }

    $postLink(): void {
        if (this.$parentButton) {
            this.$parentButton.handleChildButton(this);
        } else {
            this.$bar.handleChildButton(this);
            // this.$resizer = new ResizeObserver((entries) => {
            //     entries.forEach((entry) => {
            //         console.log(entry.contentBoxSize);
            //     });
            // });
            // this.$resizer.observe(this.$element[0]);
        }
    }

    $onDestroy(): void {
        this.eventSvc.destroy(this.subs);
    }

    buttonClicked(e: JQuery.ClickEvent): void {
        if (!this.toggleEvent) {
            this.handleToggle();
        }
        if (!this.spinEvent) {
            this.handleSpin();
        }
        this.handleSelected();

        const data: veCoreEvents.buttonClicked = {
            $event: e,
            clicked: this.buttonId,
            button: this,
        };
        //Setup fire button-bar click event
        this.eventSvc.$broadcast<veCoreEvents.buttonClicked>(this.$bar.getId(), data);
    }

    public handleToggle = (state?: boolean): void => {
        if (this.toggleable) {
            this.toggled = state != null ? state : !this.toggled;
            if (this.toggled) {
                this.tooltip = this.toggledTooltip;
                this.caretIcon = this.toggledCaret;
            } else {
                this.tooltip = this.tooltipOriginal;
                this.caretIcon = this.caretIconOriginal;
            }
        }
        // if (this.dropdown_icon) {
        //     this.dropdown_toggled = state != null ? state : !this.dropdown_toggled;
        //     if (this.dropdown_toggled && this.config.dropdown.toggle_icon) {
        //         this.dropdown_icon = this.dropdown.toggle_icon;
        //     } else {
        //         this.dropdown_icon = this.dropdown_icon_original;
        //     }
        // }
    };

    public getToggled = (): boolean => this.toggled;

    public handleSpin = (state?: boolean): void => {
        if (this.spinnable) {
            this.spin = state != null ? state : !this.spin;
            if (this.spin) {
                this.icon = 'fa fa-spinner fa-spin';
            } else {
                this.icon = this.iconOriginal;
            }
        }
    };

    public handleSelected = (state?: boolean): void => {
        if (this.selectable) {
            this.selected = state != null ? state : !this.selected;
            if (this.selected) {
                if (this.$parentButton) {
                    this.$parentButton.childSelected(this.buttonId);
                } else {
                    this.$bar.childSelected(this.buttonId);
                }
            }
        }
    };

    public childSelected = (id: string): void => {
        for (const buttonId of Object.keys(this.buttons)) {
            if (buttonId != id) {
                this.buttons[id].handleSelected(false);
            }
        }
    };

    public toggleLock = (): void => {
        this.locked = !this.locked;
    };

    public setPlacement = (placement: string): void => {
        this.placement = placement;
    };

    public setPermission = (permission: boolean): void => {
        this.permission = permission;
    };

    public isActive = (): boolean => {
        return this.active;
    };

    public checkActive = (): void => {
        if (this.activationCb) {
            if (this.enabledFor) {
                this.setActive(false);
                for (const enableState of this.enabledFor) {
                    if (this.activationCb({ state: enableState })) {
                        this.setActive(true);
                        break;
                    }
                }
            }
            if (this.disabledFor) {
                this.setActive(true);
                for (const disableState of this.disabledFor) {
                    if (this.activationCb({ state: disableState })) {
                        this.setActive(false);
                        break;
                    }
                }
            }
        }
    };

    public setActive = (active: boolean): void => {
        this.active = active;
        if (Object.keys(this.buttons).length > 0) {
            Object.keys(this.buttons).forEach((id) => {
                this.buttons[id].setActive(active);
            });
        }
    };

    handleChildButton(child: BarButton): void {
        this.buttons[child.buttonId] = child;
    }
}

const BarButtonComponent: VeComponentOptions = {
    selector: 'barButton',
    bindings: {
        buttonId: '@',
        icon: '@',
        selectable: '<',
        tooltip: '@',
        toggleable: '<',
        toggledTooltip: '@',
        toggleEvent: '<',
        spinnable: '<',
        spinEvent: '<',
        disableCaret: '<',
        dropdownIds: '<',
        api: '@',
        action: '&?',
        className: '@',
        label: '<',
        title: '@',
        enabledFor: '<',
        disabledFor: '<',
        activationCb: '&',
        templateUrl: '@',
    },
    require: {
        $bar: '^buttonBar',
        $parentButton: '?^^barButton',
    },
    template: `
    <!-- Normal button -->
    <span id="{{$ctrl.buttonId}}" ng-if="!$ctrl.templateUrl && $ctrl.dropdownButtons.length === 0 && $ctrl.active">
    <button class="{{$ctrl.appliedClasses}} {{ $ctrl.selectable && $ctrl.selected ? 'checked-list-item' : ''}}"
            ng-click="$ctrl.buttonClicked($event)" 
            uib-tooltip="{{$ctrl.label || $ctrl.$bar.squished ? '' : $ctrl.tooltip }}" tooltip-append-to-body="false"
            tooltip-trigger="mouseenter" 
            tooltip-popup-delay="100" 
            tooltip-placement="{{$ctrl.placement}}">
        <span class="fa-stack">
            <i ng-show="$ctrl.toggled" class="fa-solid fa-square fa-stack-2x"></i>
            <i class="{{ $ctrl.icon }} fa-stack-1x {{($ctrl.toggled) ? 'fa-inverse' : ''}}"></i>
        </span>
        {{$ctrl.$bar.squished ? $ctrl.tooltip : $ctrl.title}}
    </button>
</span>
<!-- Button with dropdown buttons -->
<span id="{{$ctrl.buttonId}}" ng-if="$ctrl.dropdownIds.length > 0 && $ctrl.active" class="btn-group">
    <span ng-if="!$ctrl.$bar.squished" on-toggle="$ctrl.handleToggle()" uib-dropdown>
        <button type="button" 
                class="{{$ctrl.appliedClasses}}" uib-dropdown-toggle uib-tooltip="{{$ctrl.tooltip}}"
                tooltip-append-to-body="false" tooltip-trigger="mouseenter" tooltip-popup-delay="100"
                auto-close="{{ $ctrl.$bar.squished ? 'disabled' : 'outsideClick' }}"
                tooltip-placement="{{$ctrl.placement}}">
            <i class="{{$ctrl.icon}}"></i>
            &nbsp;{{$ctrl.title}}
            <i class="{{$ctrl.caretIcon}} fa-1xs" ng-if="!$ctrl.disableCaret"></i>
        </button>
        <div class="dropdown-menu" role="menu" uib-dropdown-menu>
            <bar-button ng-repeat="dropdownButton in $ctrl.dropdownButtons" 
                    activation-cb="$ctrl.activationCb(state)"
                    button-id="{{dropdownButton.buttonId}}"
                    icon="{{dropdownButton.icon}}"
                    placement="{{dropdownButton.placement}}"
                    selectable="dropdownButton.selectable"
                    spinnable="dropdownButton.spinnable"
                    spin-event="dropdownButton.spinEvent"
                    title="{{dropdownButton.title}}"
                    template-url="{{dropdownButton.templateUrl}}"
                    tooltip="{{dropdownButton.tooltip}}"
                    toggleable="dropdownButton.toggleable"
                    toggle-event="dropdownButton.toggleEvent"
                    toggled-tooltip="{{dropdownButton.toggledTooltip}}"
                    disable-caret="dropdownButton.disableCaret"
                    dropdown-ids="dropdownButton.dropdownIds"
                    api="{{dropdownButton.api}}"
                    action="dropdownButton.action"
                    class-name="center {{dropdownButton.id}}"
                    label="dropdownButton.label"
                    enabled-for="dropdownButton.enabledFor"
                    disabled-for="dropdownButton.disabledFor">
            </bar-button>
        </div>
    </span>
    <span ng-if="$ctrl.$bar.squished">
        <button type="button" 
                class="{{$ctrl.appliedClasses}}" ng-click="$ctrl.handleToggle()" uib-tooltip="{{$ctrl.tooltip}}"
                tooltip-append-to-body="false" tooltip-trigger="mouseenter" tooltip-popup-delay="100"
                tooltip-placement="{{$ctrl.placement}}">
            <i class="{{$ctrl.icon}}"></i>
            &nbsp;{{$ctrl.title}}
            <i class="{{$ctrl.caretIcon}} fa-1xs" ng-if="!$ctrl.disableCaret"></i>
        </button>
        <div uib-collapse="!$ctrl.toggled" class="card">
            <bar-button ng-repeat="dropdownButton in $ctrl.dropdownButtons" 
                    activation-cb="$ctrl.activationCb(state)"
                    button-id="{{dropdownButton.buttonId}}"
                    icon="{{dropdownButton.icon}}"
                    placement="{{dropdownButton.placement}}"
                    selectable="dropdownButton.selectable"
                    spinnable="dropdownButton.spinnable"
                    spin-event="dropdownButton.spinEvent"
                    title="{{dropdownButton.title}}"
                    template-url="{{dropdownButton.templateUrl}}"
                    tooltip="{{dropdownButton.tooltip}}"
                    toggleable="dropdownButton.toggleable"
                    toggle-event="dropdownButton.toggleEvent"
                    toggled-tooltip="{{dropdownButton.toggledTooltip}}"
                    disable-caret="dropdownButton.disableCaret"
                    dropdown-ids="dropdownButton.dropdownIds"
                    api="{{dropdownButton.api}}"
                    action="dropdownButton.action"
                    class-name="center {{dropdownButton.id}}"
                    label="dropdownButton.label"
                    enabled-for="dropdownButton.enabledFor"
                    disabled-for="dropdownButton.disabledFor">
            </bar-button>
        </div>
    </span>
</span>
<!-- Button with template
<span id="{{$ctrl.buttonId}}" ng-if="$ctrl.templateUrl && $ctrl.active">
    <button type="button" class="{{ $ctrl.appliedClasses }}" uib-tooltip="{{$ctrl.tooltip}}" tooltip-placement="bottom" tooltip-popup-delay="100"
    popover-trigger="outsideClick" uib-popover-template="{{$ctrl.templateUrl}}" popover-title="{{$ctrl.title}}" popover-placement="bottom-left">
    <i class="{{$ctrl.icon}}"></i>
    </button>
</span> -->
      `,
    controller: BarButton,
};

veCore.component(BarButtonComponent.selector, BarButtonComponent);
