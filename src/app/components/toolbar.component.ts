import * as angular from 'angular';
import {ToolbarApi, ToolbarService} from "../../mms-directives/services/Toolbar.service";
import {StateService} from "@uirouter/angularjs";
import {EditService} from "../../mms/services/EditService.service";
import {UxService} from "../../mms/services/UxService.service";
import {PermissionsService} from "../../mms/services/PermissionsService.service"
import {EventService} from "../../mms/services/EventService.service";

var mmsApp = angular.module('mmsApp');



/* Interfaces (Temporary) */
// interface ToolbarApi extends Object {
//     init() : void
//     addButton(any) : void
//     setIcon(id : string, icon : string) : void
//     setPermission(id : string, permission : any) : void
// }

/* Classes */
const ToolbarComponent: angular.ve.ComponentOptions = {
    selector: "toolbar", //toolbar-component
    template: `<ve-toolbar on-click="onClick(button)" mms-tb-api="$ctrl.tbApi" />`,
    bindings: {
        refOb: '<',
        documentOb: '<'
    },
    controller: class ToolbarController implements angular.IComponentController {
        static $inject = ['$state', 'UxService', 'PermissionsService', 'EditService', 'EventService', 'ToolbarService'];

        //Injected Deps
        private subs;

        //Bindings
        public refOb
        public documentOb

        //Local
        public tbApi: ToolbarApi;
        public buttons;
        private tbInitFlag;

        constructor(private $state: StateService, private uxSvc: UxService, private permissionsSvc: PermissionsService,
                    private editSvc: EditService, private eventSvc: EventService, private toolbar: ToolbarService) {
            this.tbInitFlag = false;
        }

        $onInit() {
            this.eventSvc.$init(this);

            this.tbApi = this.toolbar.getApi();
            this.tbApi.setInit(this.tbInit);
            this.tbApi.init(this);
            this.buttons = this.toolbar.buttons;

            if (this.toolbar.buttons.length > 0) {
                this.toolbar.buttons.length = 0;
            }

            this.subs.push(this.eventSvc.$on(this.toolbar.constants.SETPERMISSION, (data) => {
                this.tbApi.setPermission(data.id, data.value);
            }));

            this.subs.push(this.eventSvc.$on(this.toolbar.constants.SETICON, (data) => {
                this.tbApi.setIcon(data.id, data.value);
            }));

            this.subs.push(this.eventSvc.$on(this.toolbar.constants.TOGGLEICONSPINNER, (data) => {
                this.tbApi.toggleButtonSpinner(data.id);
            }));

            this.subs.push(this.eventSvc.$on(this.toolbar.constants.SELECT, (data) => {
                this.tbApi.select(data.id);
            }));
        };

        tbInit(tbCtrl) {
            let tbApi = tbCtrl.tbApi;
            tbApi.addButton(tbCtrl.uxSvc.getToolbarButton("element-viewer"));
            tbApi.addButton(tbCtrl.uxSvc.getToolbarButton("element-editor"));
            if (tbCtrl.editSvc.openEdits() > 0) {
                tbApi.setIcon('element-editor', 'fa-edit-asterisk');
                tbApi.setPermission('element-editor-saveall', true);
            }
            let editable = false;
            tbApi.addButton(tbCtrl.uxSvc.getToolbarButton("element-history"));
            tbApi.addButton(tbCtrl.uxSvc.getToolbarButton("tags"));
            if (tbCtrl.$state.includes('main.project.ref') && !tbCtrl.$state.includes('main.project.ref.document')) {
                editable = tbCtrl.refOb && tbCtrl.refOb.type === 'Branch' && tbCtrl.permissionsSvc.hasBranchEditPermission(tbCtrl.refOb);
                tbApi.setPermission('element-editor', editable);
                if (tbCtrl.$state.includes('main.project.ref.preview')) {
                    tbApi.addButton(tbCtrl.uxSvc.getToolbarButton("view-reorder"));
                    tbApi.setPermission("view-reorder", editable);
                }
            } else if (tbCtrl.$state.includes('main.project.ref.document')) {
                editable = tbCtrl.refOb && tbCtrl.refOb.type === 'Branch' && tbCtrl.permissionsSvc.hasBranchEditPermission(tbCtrl.refOb);
                tbApi.addButton(tbCtrl.uxSvc.getToolbarButton("view-reorder"));
                tbApi.setPermission('element-editor', editable);
                tbApi.setPermission("view-reorder", editable);
            }
        };
    }
}
/* Controllers */

mmsApp.component(ToolbarComponent.selector, ToolbarComponent)
