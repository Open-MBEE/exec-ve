import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');



/* Interfaces (Temporary) */
// interface ToolbarApi extends Object {
//     init() : void
//     addButton(any) : void
//     setIcon(id : string, icon : string) : void
//     setPermission(id : string, permission : any) : void
// }

/* Classes */
const ToolbarComponent = {
    selector: "toolbarComponent", //toolbar-component
    template: `<mms-toolbar buttons="$ctrl.buttons" on-click="onClick(button)" mms-tb-api="$ctrl.tbApi" />`,
    bindings: {
        refOb: '<',
        documentOb: '<'
    },
    controller: class ToolbarController {
        static $inject = ['$state', 'UxService', 'PermissionsService', 'EditService', 'EventService', 'ToolbarService'];
        private $state
        private UxService
        private PermissionsService
        private edit;
        private toolbar;
        private eventSvc;
        private subs;

        public refOb
        public documentOb

        public tbApi;
        public buttons;

        constructor($state, UxService, refOb, documentOb, PermissionsService, EditService, EventService, ToolbarService) {
            this.$state = $state;
            this.UxService = UxService;
            this.PermissionsService = PermissionsService;
            this.toolbar = ToolbarService;
            this.edit = EditService;
            this.eventSvc = EventService;
            this.buttons = [];
        }

        $onInit = () => {
            this.eventSvc.$init(this);

            this.tbApi = this.toolbar.getApi(this.buttons, this.tbInit);

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

        tbInit = () => {
            let tbApi = this.tbApi;
            tbApi.addButton(this.UxService.getToolbarButton("element-viewer"));
            tbApi.addButton(this.UxService.getToolbarButton("element-editor"));
            if (this.edit.openEdits() > 0) {
                tbApi.setIcon('element-editor', 'fa-edit-asterisk');
                tbApi.setPermission('element-editor-saveall', true);
            }
            let editable = false;
            tbApi.addButton(this.UxService.getToolbarButton("element-history"));
            tbApi.addButton(this.UxService.getToolbarButton("tags"));
            if (this.$state.includes('project.ref') && !this.$state.includes('project.ref.document')) {
                editable = this.refOb.type === 'Branch' && this.PermissionsService.hasBranchEditPermission(this.refOb);
                tbApi.setPermission('element-editor', editable);
                if (this.$state.includes('project.ref.preview')) {
                    tbApi.addButton(this.UxService.getToolbarButton("view-reorder"));
                    tbApi.setPermission("view-reorder", editable);
                }
            } else if (this.$state.includes('project.ref.document')) {
                editable = this.refOb.type === 'Branch' && this.PermissionsService.hasBranchEditPermission(this.refOb);
                tbApi.addButton(this.UxService.getToolbarButton("view-reorder"));
                tbApi.setPermission('element-editor', editable);
                tbApi.setPermission("view-reorder", editable);
            }
        };
    }
}
/* Controllers */

mmsApp.component(ToolbarComponent.selector, ToolbarComponent)
