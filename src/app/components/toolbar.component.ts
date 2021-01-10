import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');



/* Interfaces (Temporary) */
interface ToolbarApi extends Object {
    init() : void
    addButton(any) : void
    setIcon(id : string, icon : string) : void
    setPermission(id : string, permission : any) : void
}

/* Classes */
let ToolbarComponent = {
    selector: "toolbarComponent", //toolbar-component
    template: `<mms-toolbar buttons="$ctrl.buttons" on-click="onClick(button)" mms-tb-api="$ctrl.tbApi"></mms-toolbar>`,
    bindings: {},
    controller: class ToolbarComponent {
        private $rootScope
        private $state
        private UxService
        private refOb
        private documentOb

        public tbApi = (<ToolbarApi> {});
        public buttons = [];

        constructor($rootScope, $state, UxService, refOb, documentOb) {
            this.$rootScope = $rootScope;
            this.$state = $state;
            this.UxService = UxService;
            this.refOb = refOb;
            this.documentOb = documentOb;

            $rootScope.ve_tbApi = this.tbApi;
        }

        init() {
        this.tbApi.addButton(this.UxService.getToolbarButton("element-viewer"));
        this.tbApi.addButton(this.UxService.getToolbarButton("element-editor"));
        if (this.$rootScope.ve_edits && Object.keys(this.$rootScope.ve_edits).length > 0) {
            this.tbApi.setIcon('element-editor', 'fa-edit-asterisk');
            this.tbApi.setPermission('element-editor-saveall', true);
        }
        var editable = false;
        this.tbApi.addButton(this.UxService.getToolbarButton("element-history"));
        this.tbApi.addButton(this.UxService.getToolbarButton("tags"));
        // if ($state.includes('project.ref.document')) {
            //tbApi.addButton(UxService.getToolbarButton("jobs"));
        // }
        if (this.$state.includes('project.ref') && !this.$state.includes('project.ref.document')) {
            editable = this.documentOb._editable && this.refOb.type === 'Branch';
            this.tbApi.setPermission('element-editor', editable);
            if (this.$state.includes('project.ref.preview')) {
                this.tbApi.addButton(this.UxService.getToolbarButton("view-reorder"));
                this.tbApi.setPermission("view-reorder", editable);
            }
        } else if (this.$state.includes('project.ref.document')) {
            editable = this.documentOb._editable && this.refOb.type === 'Branch';
            this.tbApi.addButton(this.UxService.getToolbarButton("view-reorder"));
            this.tbApi.setPermission('element-editor', editable);
            this.tbApi.setPermission("view-reorder", editable);
        }
    };


    },
};

/* Controllers */

mmsApp.component(ToolbarComponent.selector, ToolbarComponent)
// .controller('ToolbarCtrl', ['$scope', '$rootScope', '$state', 'UxService', 'refOb', 'documentOb', 
// function($scope, $rootScope, $state, UxService, refOb, documentOb) {

//     var tbApi = (<ToolbarApi> {});
//     $scope.tbApi = tbApi;
//     $scope.buttons = [];

//     // TODO: Manage rootScope in controllers, for now set/get in one area of the code
//     // Set MMS $rootScope variables
//     $rootScope.ve_tbApi = tbApi;

//     tbApi.init = function()
//     {
//         tbApi.addButton(UxService.getToolbarButton("element-viewer"));
//         tbApi.addButton(UxService.getToolbarButton("element-editor"));
//         if ($rootScope.ve_edits && Object.keys($rootScope.ve_edits).length > 0) {
//             tbApi.setIcon('element-editor', 'fa-edit-asterisk');
//             tbApi.setPermission('element-editor-saveall', true);
//         }
//         var editable = false;
//         tbApi.addButton(UxService.getToolbarButton("element-history"));
//         tbApi.addButton(UxService.getToolbarButton("tags"));
//         // if ($state.includes('project.ref.document')) {
//             //tbApi.addButton(UxService.getToolbarButton("jobs"));
//         // }
//         if ($state.includes('project.ref') && !$state.includes('project.ref.document')) {
//             editable = documentOb._editable && refOb.type === 'Branch';
//             tbApi.setPermission('element-editor', editable);
//             if ($state.includes('project.ref.preview')) {
//                 tbApi.addButton(UxService.getToolbarButton("view-reorder"));
//                 tbApi.setPermission("view-reorder", editable);
//             }
//         } else if ($state.includes('project.ref.document')) {
//             editable = documentOb._editable && refOb.type === 'Branch';
//             tbApi.addButton(UxService.getToolbarButton("view-reorder"));
//             tbApi.setPermission('element-editor', editable);
//             tbApi.setPermission("view-reorder", editable);
//         }
//     };
// }]);