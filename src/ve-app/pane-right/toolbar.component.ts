import * as angular from 'angular';
import Rx from 'rx-lite';
import {ISpecToolButton, ToolbarApi, ToolbarService} from "@ve-ext/spec-tools";
import {UIRouterGlobals} from "@uirouter/angularjs";
import{PermissionsService} from "@ve-utils/mms-api-client";
import {EditService, EventService} from "@ve-utils/core-services";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ExtensionService} from "@ve-ext";
import {veApp} from "@ve-app";





/* Classes */
const ToolbarComponent: VeComponentOptions = {
    selector: "toolbar", //toolbar-component
    template: `<tools-navbar on-click="$ctrl.onClick(button)" />`,
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
        public buttons: ISpecToolButton[];

        constructor(public $uiRouterGlobals: UIRouterGlobals, public extensionSvc: ExtensionService, private permissionsSvc: PermissionsService,
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

        tbInit(tbApi: ToolbarApi, tbCtrl: { $uiRouterGlobals: UIRouterGlobals, extensionSvc: ExtensionService } & angular.IComponentController) {
            for (let tool of tbCtrl.extensionSvc.getExtensions('spec')) {
                let button = tbCtrl.toolbarSvc.getToolbarButton(tool)
                tbApi.addButton(button);
                if (button.enabledFor) {
                    button.active=false;
                    for (let enableState of button.enabledFor) {
                        if (tbCtrl.$uiRouterGlobals.current.name.indexOf(enableState) > -1) {
                            button.active=true;
                            break;
                        }
                    }
                }
                if (button.disabledFor) {
                    for (let disableState of button.disabledFor) {
                        if (tbCtrl.$uiRouterGlobals.current.name.indexOf(disableState) > -1) {
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
