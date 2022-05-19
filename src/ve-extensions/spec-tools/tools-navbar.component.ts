import * as angular from "angular";
import {EventService, RootScopeService} from "@ve-utils/services";
import {ToolbarService} from "./services/Toolbar.service";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ToolbarApi} from "./services/Toolbar.api";
import {buttonOnClickFn, ISpecToolButton} from "@ve-ext/spec-tools";

import {veExt} from "@ve-ext";


let ToolsNavbarComponent: VeComponentOptions = {
	selector: 'toolsNavbar',
	template: `
	<div class="right-toolbar">
    <div class="toolbox">
        <div ng-repeat="button in $ctrl.buttons | filter: {active: true, permission: true} | orderBy:'priority'">
            <a class="tools {{button.id}}"
               ng-class="{selected: button.selected, dynamic: button.dynamic, pulldown: button.pullDown}"
               ng-click="$ctrl.clicked(button)" uib-tooltip="{{button.tooltip}}" tooltip-trigger="mouseenter"
               tooltip-popup-delay="100" tooltip-placement="left" tooltip-append-to-body="true"><i
                class="fa {{button.icon}}"></i></a>
        </div>
    </div>
</div>
`,
	controller: class VeToolbarController implements angular.IComponentController {

		private tbApi: ToolbarApi
		public buttons: ISpecToolButton[]

		static $inject = ['growl', 'RootScopeService', 'EventService', 'ToolbarService'];

		constructor(private growl: angular.growl.IGrowlService, private rootScopeSvc: RootScopeService,
					private eventSvc: EventService, private toolbarSvc: ToolbarService) {}

		$onInit() {
			this.tbApi = this.toolbarSvc.getApi('right-toolbar');
			this.buttons = this.tbApi.buttons;
		}
		public clicked(button) {

			if (!button.permission) {
				return;
			}
			if (!button.active) {
				return;
			}

			var toggleDeactivateFlag = false;
			if (typeof this.rootScopeSvc.rightPaneClosed() === 'boolean' && this.rootScopeSvc.rightPaneToggleable() !== false)
			{
				if (button.selected || this.rootScopeSvc.rightPaneClosed())
				{
					if (button.selected && !this.rootScopeSvc.rightPaneClosed()) toggleDeactivateFlag = true;
					this.eventSvc.$broadcast('right-pane.toggle');
				}
			}

			if (this.tbApi) this.tbApi.select(button.id);

			if (button.onClick) {
				button.onClick();
			} else if (this.onClick){
				this.onClick(button);
			}
			else {
				this.growl.error("Button" + button.id + "has no click function");
			}

			if (toggleDeactivateFlag && this.tbApi) {
				this.tbApi.deactivate(button.id);
			}

		};

		protected onClick: buttonOnClickFn = (button) => {
			this.eventSvc.$broadcast(button.id, {id: button.id, category: button.category, title: button.tooltip})
		}
	}
}

veExt.component(ToolsNavbarComponent.selector,ToolsNavbarComponent);