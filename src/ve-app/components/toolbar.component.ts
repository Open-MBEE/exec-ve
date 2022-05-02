import * as angular from 'angular';
import Rx from 'rx';
import {ToolbarService} from "../../ve-extensions/content-tools/services/Toolbar.service";
import {TButton} from "../../ve-extensions/content-tools/content-tool";
import {StateService, UIRouter, UIRouterGlobals} from "@uirouter/angularjs";
import {EditService} from "../../ve-utils/services/Edit.service";
import {UxService} from "../../ve-utils/services/Ux.service";
import {PermissionsService} from "../../ve-utils/services/Permissions.service"
import {EventService} from "../../ve-utils/services/Event.service";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ToolbarApi} from "../../ve-extensions/content-tools/services/Toolbar.api";
import {ExtensionService} from "../../ve-extensions/utilities/Extension.service";

var veApp = angular.module('veApp');





/* Classes */
const ToolbarComponent: VeComponentOptions = {
    selector: "toolbar", //toolbar-component
    template: `<ve-toolbar on-click="$ctrl.onClick(button)" />`,
    bindings: {
        refOb: '<',
        documentOb: '<'
    },
    controller: class ToolbarController implements angular.IComponentController {
        static $inject = ['$state', 'ExtensionService', 'PermissionsService', 'EditService', 'EventService', 'ToolbarService'];

        //Injected Deps
        public subs: Rx.IDisposable[];

        //Bindings
        public refOb
        public documentOb

        //Local
        public tbApi: ToolbarApi;
        public buttons: TButton[];

        constructor(public $state: StateService, public extensionSvc: ExtensionService, private permissionsSvc: PermissionsService,
                    private editSvc: EditService, private eventSvc: EventService, private toolbarSvc: ToolbarService) {

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
        //TODO: Need to find a more generic way to execute the init logic (beyond just getting the button);
        tbInit(tbApi: ToolbarApi, tbCtrl: { $state: StateService, extensionSvc: ExtensionService } & angular.IComponentController) {
            for (let tool of tbCtrl.extensionSvc.getExtensions('content')) {
                let button = tbCtrl.toolbarSvc.getToolbarButton(tool)
                tbApi.addButton(button);
                if (button.enabledFor) {
                    button.active=false;
                    for (let enableState of button.enabledFor) {
                        if (tbCtrl.$state.includes(enableState)) {
                            button.active=true;
                            break;
                        }
                    }
                }
                if (button.disabledFor) {
                    for (let disableState of button.disabledFor) {
                        if (tbCtrl.$state.includes(disableState)) {
                            button.active=false;
                            break;
                        }
                    }
                }
                if (!button.permission) {
                    button.permission = tbCtrl.refOb && tbCtrl.refOb.type === 'Branch' && tbCtrl.permissionsSvc.hasBranchEditPermission(tbCtrl.refOb);
                }
            }
        };
    }
}
/* Controllers */

veApp.component(ToolbarComponent.selector, ToolbarComponent)
