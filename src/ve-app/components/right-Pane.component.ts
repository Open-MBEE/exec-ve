import * as angular from 'angular';
import Rx from 'rx';
var veApp = angular.module('veApp');
import { StateService } from '@uirouter/angularjs';
import {ElementService} from "../../ve-utils/services/Element.service";
import {ProjectService} from "../../ve-utils/services/Project.service";
import {Utils} from "../../ve-core/utilities/CoreUtils.service";
import {RootScopeService} from "../../ve-utils/services/RootScope.service";
import {PermissionsService} from "../../ve-utils/services/Permissions.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {EditService} from "../../ve-utils/services/Edit.service";
import { ToolbarService } from 'src/ve-extensions/content-tools/services/Toolbar.service';
import {SpecObject, SpecService} from "../../ve-extensions/content-tools/services/Spec.service";
import {ContentReorderService} from "../../ve-extensions/content-tools/services/ContentReorder.service";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ElementObject} from "../../ve-utils/types/mms";




/* Controllers */

//veApp.controller('ToolCtrl', ['this', ]);
//TODO: Make this more flexible and based on a more extensible pattern?
// Example:https://kamranicus.com/dynamic-angularjs-components/
let RightPaneComponent: VeComponentOptions = {
    selector: 'rightPane',
    template: `
    <div class="pane-right">
    <tools-pane tools-category="$ctrl.toolsCategory"></tools-pane>
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
        $pane: '^^faPane'
    },
    controller: class RightPaneController implements angular.IComponentController {

        private projectOb;
        refOb;
        tagObs;
        branchObs;
        documentOb;
        viewOb;

        

        public subs: Rx.IDisposable[];

        private specInfo: SpecObject;
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
            'ElementService', 'ProjectService', 'Utils', 'PermissionsService', 'RootScopeService', 'EventService',
            'EditService', 'ToolbarService', 'SpecService']

        constructor(private $scope, private $uibModal: angular.ui.bootstrap.IModalService,
                    private $q: angular.IQService, private $timeout: angular.ITimeoutService,
                    private hotkeys: angular.hotkeys.HotkeysProvider, private growl: angular.growl.IGrowlService,
                    private elementSvc: ElementService, private projectSvc: ProjectService, private utils: Utils,
                    private permissionsSvc: PermissionsService, private rootScopeSvc: RootScopeService,
                    private eventSvc: EventService, private editSvc: EditService, private toolbarSvc: ToolbarService,
                    private specSvc: SpecService) {
        }

        $onInit() {
            this.eventSvc.$init(this);
            this.$pane = this.$scope.$parent.$parent.$parent.$pane;
            this.specInfo = {
                refId: this.refOb.id,
                refType: this.refOb.type,
                commitId: 'latest',
                projectId: this.projectOb.id,
                id: ""
            }
            this.specSvc.specInfo = this.specInfo
                this.specSvc.editable = this.documentOb && this.refOb.type === 'Branch' && this.permissionsSvc.hasBranchEditPermission(this.refOb);

            //Set the viewOb if found first otherwise fallback to documentOb or nothing
            if (this.viewOb) {
                this.specInfo.id = this.viewOb.id;
            } else if (this.documentOb) {
                this.specInfo.id = this.documentOb.id;
            }

            //Independent of viewOb if there is a document we want document tools enabled
            if (this.documentOb) {
                this.toolsCategory = "document";
            }

            this.rootScopeSvc.rightPaneClosed(this.$pane.closed);

            this.subs.push(this.eventSvc.$on('right-pane-toggled', () => {
                this.rootScopeSvc.rightPaneClosed(this.$pane.closed);
            }));

            this.subs.push(this.eventSvc.$on('right-pane-toggle', (paneClosed) => {
                if (paneClosed === undefined) {
                    this.$pane.toggle();
                } else if (paneClosed && !this.$pane.closed) {
                    this.$pane.toggle();
                } else if (!paneClosed && this.$pane.closed) {
                    this.$pane.toggle();
                }
            }));

            this.subs.push(this.eventSvc.$on('elementSelected', (data) => {
                let elementOb = data.elementOb;
                let commitId = (data.commitId) ? data.commitId : null;
                let displayOldContent = (data.displayOldContent) ? data.displayOldContent : null;
                this.specInfo.id = elementOb.id;
                this.specInfo.projectId = elementOb._projectId;
                this.specInfo.refId = elementOb._refId;
                this.specInfo.commitId = commitId ? commitId : elementOb._commitId;
                this.specInfo.displayOldContent = displayOldContent;

                if (this.specSvc.setEditing) {
                    this.specSvc.setEditing(false);
                }
                var editable = this.refOb.type === 'Branch' && commitId === 'latest' && this.permissionsSvc.hasBranchEditPermission(this.refOb);
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {
                    id: 'element',
                    value: editable
                });
                this.eventSvc.$broadcast('content-changed');
            }));

            this.subs.push(this.eventSvc.$on('viewSelected', (data) => {
                let elementOb = data.elementOb;
                let commitId = (data.commitId) ? data.commitId : null;
                this.eventSvc.$broadcast('elementSelected', {elementOb: elementOb, commitId: commitId});
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
            //If there is a view pre-selected, send the viewSelected event to the spec tools system
            if (this.viewOb || this.documentOb) {
                let data = {
                    elementOb: (this.viewOb) ? this.viewOb : this.documentOb,
                    commitId: 'latest'
                };
                this.eventSvc.$broadcast("viewSelected", data)
            }
        }
    }
}

veApp.component(RightPaneComponent.selector,RightPaneComponent);
