import * as angular from 'angular';
import Rx from 'rx-lite';
import {
    ElementService,
    PermissionsService,
    ProjectService
} from "@ve-utils/mms-api-client"
import {
    EditService,
    EventService,
    RootScopeService
} from "@ve-utils/core-services";
import {CoreUtilsService} from "@ve-core/core";
import {ToolbarService} from 'src/ve-extensions/spec-tools/services/Toolbar.service';
import {SpecApi, SpecService} from "../../ve-extensions/spec-tools/services/Spec.service";
import {VeComponentOptions, VeModalService} from "@ve-types/view-editor";

import {veApp} from "@ve-app";
import {ElementObject, ElementsRequest} from "@ve-types/mms";


/* Controllers */

//veApp.controller('ToolCtrl', ['this', ]);
//TODO: Make this more flexible and based on a more extensible pattern?
// Example:https://kamranicus.com/dynamic-angularjs-components/
let RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right">
    <tools-pane tools-category="{{$ctrl.toolsCategory}}"></tools-pane>
</div>
    `,
    bindings: {
        projectOb: "<",
        refOb: "<",
        tagObs: "<",
        branchObs: "<",
        documentOb: "<",
        viewOb: "<"
    },
    require: {
        $pane: '^^ngPane'
    },
    controller: class RightPaneController implements angular.IComponentController {

        private projectOb;
        refOb;
        tagObs;
        branchObs;
        documentOb;
        viewOb;

        

        public subs: Rx.IDisposable[];

        private specApi: SpecApi;
        protected toolsCategory:string = "global";
        // viewContentsOrderApi: ContentReorderApi;
        // editable: any;
        // viewId: any;
        // elementSaving: boolean;
        // openEdits: number;
        // edits: {};
        // viewCommitId: any;
        private $pane

        static $inject = ['$scope', '$uibModal', '$q', '$timeout', 'hotkeys', 'growl',
            'ElementService', 'ProjectService', 'CoreUtilsService', 'PermissionsService', 'RootScopeService', 'EventService',
            'EditService', 'ToolbarService', 'SpecService']

        constructor(private $scope, private $uibModal: VeModalService,
                    private $q: angular.IQService, private $timeout: angular.ITimeoutService,
                    private hotkeys: angular.hotkeys.HotkeysProvider, private growl: angular.growl.IGrowlService,
                    private elementSvc: ElementService, private projectSvc: ProjectService, private utils: CoreUtilsService,
                    private permissionsSvc: PermissionsService, private rootScopeSvc: RootScopeService,
                    private eventSvc: EventService, private editSvc: EditService, private toolbarSvc: ToolbarService,
                    private specSvc: SpecService) {
        }

        $onInit() {
            this.eventSvc.$init(this);
            this.specApi = {
                refId: this.refOb.id,
                refType: this.refOb.type,
                commitId: 'latest',
                projectId: this.projectOb.id,
                elementId: ""
            }
            this.specSvc.specApi = this.specApi
                this.specSvc.editable = this.documentOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb);

            //Set the viewOb if found first otherwise fallback to documentOb or nothing
            if (this.viewOb) {
                this.specApi.elementId = this.viewOb.id;
            } else if (this.documentOb) {
                this.specApi.elementId = this.documentOb.id;
            }

            //Independent of viewOb if there is a document we want document tools enabled
            if (this.documentOb) {
                this.toolsCategory = "document";
            }

            //Init Pane Toggle Controls
            this.rootScopeSvc.rightPaneClosed(this.$pane.closed);

            this.subs.push(this.$pane.$toggled.subscribe(() => {
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed);
            }));

            this.subs.push(this.eventSvc.$on('right-pane.toggle', (paneClosed) => {
                if (paneClosed === undefined) {
                    this.$pane.toggle();
                } else if (paneClosed && !this.$pane.closed) {
                    this.$pane.toggle();
                } else if (!paneClosed && this.$pane.closed) {
                    this.$pane.toggle();
                }
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed);
            }));

            this.subs.push(this.eventSvc.$on('element.selected', (data: {elementOb: ElementObject, commitId: string, displayOldSpec: boolean}) => {
                let elementOb = data.elementOb;
                let commitId = (data.commitId) ? data.commitId : null;
                let displayOldSpec = (data.displayOldSpec) ? data.displayOldSpec : null;
                this.specApi.elementId = elementOb.id;
                this.specApi.projectId = elementOb._projectId;
                this.specApi.refId = elementOb._refId;
                this.specApi.commitId = commitId ? commitId : elementOb._commitId;
                this.specApi.displayOldSpec = displayOldSpec;

                if (this.specSvc.setEditing) {
                    this.specSvc.setEditing(false);
                }
                var editable = this.refOb.type === 'Branch' && commitId === 'latest' && this.permissionsSvc.hasBranchEditPermission(this.refOb);
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                    id: 'element',
                    value: editable
                });
                this.specSvc.setElement().then(() => {
                    this.eventSvc.$broadcast('spec.ready');
                });
            }));

            this.subs.push(this.eventSvc.$on('element.updated',(data: {element: ElementObject, continueEdit: boolean}) => {
                let elementOb = data.element;
                let continueEdit = data.continueEdit;
                if (elementOb.id === this.specApi.elementId && elementOb._projectId === this.specApi.projectId &&
                    elementOb._refId === this.specApi.refId && !continueEdit) {
                    this.specSvc.setElement().then(() => {
                        this.eventSvc.$broadcast('spec.ready');
                    });
                }
            }));

            this.subs.push(this.eventSvc.$on('view.selected', (data) => {
                let elementOb = data.elementOb;
                let commitId = (data.commitId) ? data.commitId : null;
                this.eventSvc.$broadcast('element.selected', {elementOb: elementOb, commitId: commitId});
                this.viewOb = elementOb;
                var editable = this.refOb.type === 'Branch' && commitId === 'latest' && this.permissionsSvc.hasBranchEditPermission(this.refOb);
                //this.viewCommitId = commitId ? commitId : elementOb._commitId;
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                    id: 'view',
                    value: editable
                });
            }));
        }

        $postLink() {
            //If there is a view pre-selected, send the view.selected event to the spec tools system
            if (this.viewOb || this.documentOb) {
                let data = {
                    elementOb: (this.viewOb) ? this.viewOb : this.documentOb,
                    commitId: 'latest'
                };
                this.eventSvc.$broadcast("view.selected", data)
            }
        }
    }
}

veApp.component(RightPaneComponent.selector,RightPaneComponent);
