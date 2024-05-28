import { IPane, IRegion } from '@openmbee/pane-layout';

import { BarButton, ButtonBarApi, ButtonBarService } from '@ve-core/button-bar';
import { EventService } from '@ve-utils/core';

import { veUtils } from '@ve-utils';

import { VeComponentOptions } from '@ve-types/angular';

export class ButtonBarController implements angular.IComponentController {
    // Bindings
    private buttonId: string;
    private minSize: number;

    //Parent
    private $pane: IPane;
    private resizer: Rx.Disposable;

    private bbApi: ButtonBarApi;
    public init: boolean = false;
    public buttons: BarButton[];
    public dropdownIcon: { [id: string]: string };
    private squished: boolean = false;
    private squishButton: BarButton;
    private size: number;
    static $inject = ['$element', 'growl', 'EventService', 'ButtonBarService'];

    constructor(
        private $element: JQuery<HTMLElement>,
        private growl: angular.growl.IGrowlService,
        private eventSvc: EventService,
        private buttonBarSvc: ButtonBarService
    ) {}

    $onInit(): void {
        this.minSize = 100;
        this.buttonBarSvc.waitForApi(this.buttonId).then(
            (api) => {
                this.bbApi = api;
                this.squishButton = this.buttonBarSvc.getButtonBarButton('button-bar-menu');
                this.squishButton.dropdown_buttons = this.bbApi.buttons;
                this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
                this.handleResize();
            },
            (reason) => {
                this.growl.error(reason.message);
            }
        );
    }

    $onDestroy(): void {
        this.resizer.dispose();
    }

    handleResize = (): void => {
        this.size = (this.$pane.$element as JQuery<HTMLElement>)[0].clientWidth;
        if (Number.isInteger(this.size)) {
            this.squished = this.minSize > this.size;
        } else {
            this.squished = false;
        }
        this.buttons = this.squished ? [this.squishButton] : this.bbApi.buttons;
    };

    getButtonId = (): string => {
        return this.buttonId;
    };
}

const ButtonBarComponent: VeComponentOptions = {
    selector: 'buttonBar',
    transclude: true,
    template: `
    <div class="button-bar" ng-transclude>
</div>
`,
    bindings: {
        buttonId: '<',
        minSize: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    controller: ButtonBarController,
};

veUtils.component(ButtonBarComponent.selector, ButtonBarComponent);
