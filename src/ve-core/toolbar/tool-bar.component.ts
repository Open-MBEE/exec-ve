import { veCoreEvents } from '@ve-core/events';
import { buttonOnClickFn, IToolBarButton } from '@ve-core/toolbar';
import { RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';

import { veCore } from '@ve-core';

import { ToolbarService } from './services/Toolbar.service';

import { VeComponentOptions } from '@ve-types/angular';

const ToolBarComponent: VeComponentOptions = {
    selector: 'toolBar',
    template: `
	<div class="{{$ctrl.toolbarId}}">
    <div class="toolbox">
        <div ng-repeat="button in $ctrl.buttons | filter: {active: true, permission: true} | orderBy:'priority'">
            <a class="tools {{button.id}}"
               ng-class="{selected: button.selected, dynamic: button.dynamic, pulldown: button.pullDown}"
               ng-click="$ctrl.clicked(button)" uib-tooltip="{{button.tooltip}}" tooltip-trigger="mouseenter"
               tooltip-popup-delay="100" tooltip-placement="{{$ctrl.tooltipAnchor}}" tooltip-append-to-body="true"><i
                class="fa {{button.icon}}"></i></a>
        </div>
    </div>
</div>
`,
    bindings: {
        anchor: '<',
        toolbarId: '@',
        paneToggle: '&',
    },
    controller: class VeToolbarController implements angular.IComponentController {
        public subs: Rx.IDisposable[];

        private anchor: string;
        private toolbarId: string;
        private paneToggle?(): void;

        public buttons: IToolBarButton[];

        tooltipAnchor;

        static $inject = ['growl', 'RootScopeService', 'EventService', 'ToolbarService'];

        constructor(
            private growl: angular.growl.IGrowlService,
            private rootScopeSvc: RootScopeService,
            private eventSvc: EventService,
            private toolbarSvc: ToolbarService
        ) {}

        $onInit(): void {
            this.eventSvc.$init(this);

            if (this.anchor) {
                switch (this.anchor) {
                    case 'left':
                        this.tooltipAnchor = 'right';
                        break;
                    case 'right':
                        this.tooltipAnchor = 'left';
                        break;
                    case 'top':
                        this.tooltipAnchor = 'bottom';
                        break;
                    case 'bottom':
                        this.tooltipAnchor = 'top';
                        break;
                }
            } else {
                this.tooltipAnchor = 'left';
            }

            this.toolbarSvc.waitForApi(this.toolbarId).then(
                (api) => {
                    this.buttons = api.buttons;
                    if (this.buttons.length > 0) {
                        //Binding to catch all "clicks" on tb and execute select function
                        this.eventSvc.binding<veCoreEvents.toolbarClicked>(this.toolbarId, (data) => {
                            this.toolbarSvc.waitForApi(this.toolbarId).then(
                                (api) => api.select(data.id),
                                (reason) => this.growl.error(ToolbarService.error(reason))
                            );
                        });
                    }
                },
                (reason) => {
                    this.growl.error(reason.message);
                }
            );
        }
        public clicked = (button: IToolBarButton): void => {
            if (!button.permission) {
                return;
            }
            if (!button.active) {
                return;
            }

            if (this.paneToggle) {
                this.paneToggle();
            }

            if (button.onClick) {
                button.onClick();
            } else if (this.onClick) {
                this.onClick(button);
            } else {
                this.growl.error('Button' + button.id + 'has no click function');
            }
        };

        protected onClick: buttonOnClickFn = (button) => {
            if (!button.dynamic) {
                this.eventSvc.resolve<veCoreEvents.toolbarClicked>(this.toolbarId, {
                    id: button.id,
                    category: button.category,
                    title: button.tooltip,
                });
            } else {
                this.eventSvc.$broadcast<void>(button.id);
            }
        };
    },
};

veCore.component(ToolBarComponent.selector, ToolBarComponent);
