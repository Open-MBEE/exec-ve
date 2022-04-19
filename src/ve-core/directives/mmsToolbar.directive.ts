import * as angular from "angular";
import {RootScopeService} from "../../ve-utils/services/RootScope.service";
import {buttonOnClickFn, TButton, ToolbarService} from "../tools/Toolbar.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";

import {veCore} from "../ve-core.module";

let VeToolbarComponent: VeComponentOptions = {
	selector: 'veToolbar',
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
	bindings: {
		onClick: '&'
	},
	controller: class VeToolbarController implements angular.IComponentController {

		private tbApi
		public buttons

		//Bindings
		public onClick: buttonOnClickFn | undefined

		static $inject = ['growl', 'RootScopeService', 'EventService', 'ToolbarService'];

		constructor(private growl: angular.growl.IGrowlService, private rootScopeSvc: RootScopeService,
					private eventSvc: EventService, private toolbarSvc: ToolbarService) {}

		$onInit() {
			this.tbApi = this.toolbarSvc.getApi();
			this.buttons = this.toolbarSvc.buttons;
		}
		public clicked(button) {

			if (!button.permission) {
				return;
			}
			if (!button.active) {
				return;
			}

			var toggleDecativeFlag = false;
			if (typeof this.rootScopeSvc.rightPaneClosed() === 'boolean' && this.rootScopeSvc.rightPaneToggleable() !== false)
			{
				if (button.selected || this.rootScopeSvc.rightPaneClosed())
				{
					if (button.selected && !this.rootScopeSvc.rightPaneClosed()) toggleDecativeFlag = true;
					this.eventSvc.$broadcast('right-pane-toggle');
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

			if (toggleDecativeFlag && this.tbApi) {
				this.tbApi.deactivate(button.id);
			}

		};
	}
}

veCore.component(VeToolbarComponent.selector,VeToolbarComponent);