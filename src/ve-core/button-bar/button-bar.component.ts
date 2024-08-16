import { IPane, IPaneManagerService } from '@openmbee/pane-layout';

import { BarButton, ButtonBarService } from '@ve-core/button-bar';
import { EventService } from '@ve-utils/core';

import { veUtils } from '@ve-utils';

import { VeComponentOptions } from '@ve-types/angular';

export class ButtonBarController implements angular.IComponentController {
    // Bindings
    private barId: string;
    private menu: boolean;

    private minSize: number;

    //Parent
    private $pane: IPane;
    private listeners: Rx.Disposable[] = [];

    activationCb: ({ state }) => boolean;

    //Local
    count = 0;

    public init: boolean = false;
    public buttons: { [id: string]: BarButton } = {};
    public dropdownIcon: { [id: string]: string };
    private hide: boolean = false;
    public squished: boolean = false;
    private squishButton: BarButton;
    private size: number;
    static $inject = ['$element', '$timeout', '$paneManager', 'growl', 'EventService', 'ButtonBarService'];

    constructor(
        private $element: JQuery<HTMLElement>,
        private $timeout: angular.ITimeoutService,
        private $paneManager: IPaneManagerService,
        private growl: angular.growl.IGrowlService,
        private eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.minSize = 0;
        //this.squishButton = this.buttonBarSvc.getButtonBarButton('button-bar-menu');
        //this.squishButton.dropdown_buttons = this.bbApi.buttons;
        if (this.menu) {
            this.squished = false;
        }
        this.listeners.push(
            this.$paneManager.$onResizeStop.subscribe((e) => {
                void this.$timeout(() => {
                    this.handleResize();
                });
            })
        );
        // this.resizer = new MutationObserver((mutations) => {
        //     mutations.forEach((mutation) => {
        //         if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        //             const width = (mutation.target as HTMLElement).offsetWidth;
        //             if (width != this.size) {
        //                 this.size = width;
        //                 this.handleResize();
        //             }
        //         }
        //     });
        // });
        // this.resizer.observe(this.$element[0], {
        //     attributes: true,
        //     attributeFilter: ['style'],
        // });
        this.handleResize();
    }

    $onDestroy(): void {
        this.listeners.forEach((listener) => listener.dispose());
    }

    handleChildButton(child: BarButton): void {
        this.count++;
        if (!child.buttonId) {
            child.buttonId = this.count.toString();
        }
        if (Object.keys(this.buttons).length === 0) {
            child.setPlacement('bottom-left');
            //} else if (!button.placement) {
        } else {
            child.setPlacement('bottom');
        }
        this.buttons[child.buttonId] = child;
    }

    public getId = (): string => {
        return this.barId;
    };

    handleResize = (): void => {
        if (this.menu) {
            return;
        }
        this.size = (this.$pane.$element as JQuery<HTMLElement>).width();
        let barSize = 0;
        let count = 0;
        Object.keys(this.buttons).forEach((id) => {
            if (this.buttons[id].isActive()) {
                barSize = barSize + this.buttons[id].$element.width();
                count++;
            }
        });

        this.minSize = barSize === 0 ? count * 46 : barSize;
        if (Number.isInteger(this.size)) {
            this.squished = this.minSize > this.size;
        } else {
            this.squished = false;
        }
    };

    // public select = (parentButton: BarButton, childButton: BarButton): void => {
    //     if (parentButton && childButton && childButton.config.selectable) {
    //         parentButton.dropdown_buttons.forEach((dropdownButton) => {
    //             if (parentButton.dropdown) {
    //                 if (dropdownButton.id === childButton.id) {
    //                     dropdownButton.selected = dropdownButton.selected ? !dropdownButton.selected : true;
    //                 }
    //             } else {
    //                 dropdownButton.selected = dropdownButton.id === childButton.id;
    //             }
    //         });
    //     }
    // };

    public setPermission = (id: string, permission: boolean): void => {
        if (Object.keys(this.buttons).includes(id)) this.buttons[id].setPermission(permission);
    };

    // public addButton = (button: BarButton): void => {
    //     if (Object.keys(this.buttons).length === 0) {
    //         button.setPlacement('bottom-left');
    //         //} else if (!button.placement) {
    //     } else {
    //         button.setPlacement('bottom');
    //     }
    //     this.buttons[button.id] = button;
    // };

    // public toggleButtonSpinner = (id: string): void => {
    //     this.buttons.forEach((button) => {
    //         if (button.id === id) button.toggleSpin();
    //         else button.toggleLock();
    //     });
    // };

    public toggleButton = (id: string, state?: boolean): void => {
        this.buttons[id].handleToggle(state);
    };

    public childSelected = (id: string): void => {
        for (const buttonId of Object.keys(this.buttons)) {
            if (buttonId != id) {
                this.buttons[id].handleSelected(false);
            }
        }
    };
}

const ButtonBarComponent: VeComponentOptions = {
    selector: 'buttonBar',
    transclude: true,
    template: `
<!--<div id="{{$ctrl.barId}}" class="button-bar" role="group" uib-dropdown auto-close="outsideClick" ng-if="$ctrl.squished">
    <button type="button" class="btn btn-tools btn-sm dropdown-toggle" uib-dropdown-toggle>
        <i class="fa-solid fa-bars fa-lg"></i>
        <i class="fa-solid fa-caret-down fa-1xs"></i>
    </button>
    <div class="dropdown-menu dropdown-menu-left button-dropdown-menu" uib-dropdown-menu role="menu" ng-transclude>
    </div>
</div>-->
<div id="{{$ctrl.barId}}" class="button-bar" ng-transclude></div>
`,
    bindings: {
        barId: '@',
        menu: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    controller: ButtonBarController,
};

veUtils.component(ButtonBarComponent.selector, ButtonBarComponent);
