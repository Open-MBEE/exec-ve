import * as angular from 'angular';
import {TButton, ToolbarApi, ToolbarService} from "../../ve-directives/services/toolbar.service";
import {StateService} from "@uirouter/angularjs";
import {EditService} from "../../ve-utils/services/EditService.service";
import {UxService} from "../../ve-utils/services/UxService.service";
import {PermissionsService} from "../../ve-utils/services/PermissionsService.service"
import {EventService} from "../../ve-utils/services/EventService.service";

var veApp = angular.module('veApp');





/* Classes */
const ToolbarComponent: angular.ve.ComponentOptions = {
    selector: "toolbar", //toolbar-component
    template: `<ve-toolbar on-click="$ctrl.onClick(button)" />`,
    bindings: {
        refOb: '<',
        documentOb: '<'
    },
    controller: class ToolbarController implements angular.IComponentController {
        static $inject = ['$state', 'UxService', 'PermissionsService', 'EditService', 'EventService', 'ToolbarService'];

        //Injected Deps
        private subs: Promise<PushSubscription>[];

        //Bindings
        public refOb
        public documentOb

        //Local
        public tbApi: ToolbarApi;
        public buttons: TButton[];
        private tbInitFlag;

        constructor(private $state: StateService, private uxSvc: UxService, private permissionsSvc: PermissionsService,
                    private editSvc: EditService, private eventSvc: EventService, private toolbarSvc: ToolbarService) {
            this.tbInitFlag = false;
        }

        $onInit() {
            this.eventSvc.$init(this);

            this.tbApi = this.toolbarSvc.getApi();
            if (this.toolbarSvc.buttons.length > 0) {
                this.toolbarSvc.buttons.length = 0;
            }
            this.tbApi.setInit(this.tbInit);
            this.tbApi.init(this);
            this.buttons = this.toolbarSvc.buttons;

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

veApp.component(ToolbarComponent.selector, ToolbarComponent)
