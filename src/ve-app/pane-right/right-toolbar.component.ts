import * as angular from 'angular';
import Rx from 'rx-lite';
import {IToolBarButton, ToolbarApi, ToolbarService} from "@ve-core/tool-bar";
import {UIRouterGlobals} from "@uirouter/angularjs";
import{PermissionsService} from "@ve-utils/mms-api-client";
import {AutosaveService, EventService} from "@ve-utils/services";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ExtensionService} from "@ve-components/services";
import {veApp} from "@ve-app";





/* Classes */
const RightToolbarComponent: VeComponentOptions = {
    selector: "rightToolbar", //toolbar-component
    template: `<tool-bar on-click="$ctrl.onClick(button)" />`,
    bindings: {
        refOb: '<',
        documentOb: '<'
    },
    controller: class ToolbarController implements angular.IComponentController {
        static $inject = ['$state', 'ExtensionService', 'PermissionsService', 'AutosaveService', 'EventService', 'ToolbarService'];

        //Injected Deps
        public subs: Rx.IDisposable[];

        //Bindings
        public refOb
        public documentOb

        //Local
        public tbApi: ToolbarApi;
        public buttons: IToolBarButton[];

        constructor(public $uiRouterGlobals: UIRouterGlobals, public extensionSvc: ExtensionService, private permissionsSvc: PermissionsService,
                    private autosaveSvc: AutosaveService, private eventSvc: EventService, private toolbarSvc: ToolbarService) {

        }

        $onInit() {

            this.eventSvc.$init(this);

            this.tbApi = this.toolbarSvc.initApi('right-toolbar', this.tbInit, this);
            this.buttons = this.tbApi.buttons;

            this.subs.push(this.eventSvc.$on(this.toolbarSvc.constants.SETPERMISSION, (data) => {
                this.tbApi.setPermission(data.id, data.value);
            }));

            this.subs.push(this.eventSvc.$on(this.toolbarSvc.constants.SETICON, (data) => {
                this.tbApi.setIcon(data.id, data.value);
            }));

            this.subs.push(this.eventSvc.$on(this.toolbarSvc.constants.TOGGLEICONSPINNER, (data) => {
                this.tbApi.toggleButtonSpinner(data.id);
            }));

            this.subs.push(this.eventSvc.$on(this.toolbarSvc.constants.SELECT, (data) => {
                this.tbApi.select(data.id);
            }));
        };

        tbInit = (tbApi: ToolbarApi) => {
            for (const tool of this.extensionSvc.getExtensions('spec')) {
                const button = this.toolbarSvc.getToolbarButton(tool)
                tbApi.addButton(button);
                if (button.enabledFor) {
                    button.active=false;
                    for (const enableState of button.enabledFor) {
                        if (this.$uiRouterGlobals.current.name.indexOf(enableState) > -1) {
                            button.active=true;
                            break;
                        }
                    }
                }
                if (button.disabledFor) {
                    for (const disableState of button.disabledFor) {
                        if (this.$uiRouterGlobals.current.name.indexOf(disableState) > -1) {
                            button.active=false;
                            break;
                        }
                    }
                }
                if (!button.permission) {
                    button.permission = this.refOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb);
                }
            }
        };
    }
}
/* Controllers */

veApp.component(RightToolbarComponent.selector, RightToolbarComponent)
