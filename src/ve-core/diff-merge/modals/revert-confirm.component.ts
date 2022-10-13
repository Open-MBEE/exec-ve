import * as angular from 'angular';
import{ElementService} from "@ve-utils/mms-api-client";
import {EventService} from "@ve-utils/services";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementObject} from "@ve-types/mms";

import {veCore} from "@ve-core";

const RevertConfirmComponent: VeComponentOptions = {
    selector: 'revertConfirm',
    template: `
    <div class="modal-header">
    <h4>Revert element documentation, name, and value</h4>
</div>

<div class="modal-body revert-dialogue">
    <p>Revert documentation, name, and value of this element from 
    <b>{{$ctrl.compareCommit.commitSelected._creator}} - {{$ctrl.compareCommit.commitSelected._created | date:'M/d/yy h:mm a'}}</b> on {{$ctrl.compareCommit.ref.type}}: <b>{{$ctrl.compareCommit.ref.name}}</b>
    to 
    <b>{{$ctrl.baseCommit.commitSelected._creator}} - {{$ctrl.baseCommit.commitSelected._created | date:'M/d/yy h:mm a'}}</b>
    on {{$ctrl.baseCommit.refSelected.type}}: <b>{{$ctrl.baseCommit.refSelected.name}}</b>.</p>
    <p>This will create a new version under your user name on <b>{{$ctrl.compareCommit.ref.name}}.</b></p>
    <p>Cross reference contents will NOT be reverted.</p>

    <h3>Preview Element</h3>
    <div class="element-preview-box">
        <h1 class="prop element-title">
            <mms-cf mms-cf-type="name" mms-element-id="{{$ctrl.elementId}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.baseCommit.refSelected.id}}" mms-commit-id="{{$ctrl.baseCommit.commitSelected.id}}"></mms-cf>
        </h1>
        <h2 class="prop-title spec-view-doc-heading">Documentation</h2>
        <p ng-show="!$ctrl.showDocHTML" class="doc-text">
            <mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.elementId}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.baseCommit.refSelected.id}}" mms-commit-id="{{$ctrl.baseCommit.commitSelected.id}}"></mms-cf>
        </p>
        <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot'">
        <h2 class="prop-title">Property Value</h2>
        <span class="prop">
            <mms-cf mms-cf-type="val" mms-element-id="{{$ctrl.elementId}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.baseCommit.refSelected.id}}" mms-commit-id="{{$ctrl.baseCommit.commitSelected.id}}"></mms-cf>
        </span></div>
    </div>
</div>

<div class="modal-footer">
    <button class="btn btn-warning " ng-click="ok()">Revert</button>
    <button class="btn btn-default" ng-click="cancel()">Cancel</button>
</div>
  
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class RevertConfirmController implements angular.IComponentController {

        //bindings
        public modalInstance
                dismiss
                close
                resolve

        public oking
                revertData
                elementId
                projectId
                refId
                baseCommit
                compareCommit
                element

        static $inject = ['growl', 'ElementService', 'EventService'];

        constructor(private growl, private elementSvc : ElementService, private eventSvc : EventService) {
        }

        $onInit() {
            this.revertData = this.resolve.getRevertData();
            this.elementId = this.revertData.elementId;
            this.projectId = this.revertData.projectId;
            this.refId = this.revertData.refId;
            this.baseCommit = this.revertData.baseCommit;
            this.compareCommit = this.revertData.compareCommit;
            this.element = this.revertData.element;
        }

        ok() {
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;

            const reqOb = {
                elementId: this.elementId,
                projectId: this.projectId,
                refId: this.baseCommit.refSelected.id,
                commitId: this.baseCommit.commitSelected.id
            };
            this.elementSvc.getElement(reqOb, 2, false)
                .then((data) => {
                    const revertEltInfo: ElementObject = {
                        id: this.elementId,
                        name: (data.name) ? data.name : "",
                        type: data.type,
                        documentation: data.documentation,
                        _projectId: this.projectId,
                        _refId: this.refId,
                        defaultValue: (data.defaultValue) ? data.defaultValue : undefined,
                        value: (data.value) ? data.value : undefined
                    };

                    this.elementSvc.updateElement(revertEltInfo)
                        .then((element) => {
                            const data = {
                                element: element,
                                continueEdit: false
                            }
                            this.eventSvc.$broadcast('element.updated', data);
                            this.close();
                            this.growl.success("Element reverted");
                        }, (reason) => {
                            this.growl.error("Revert not completed - Error: " + reason.message);
                        })
                }, (reason) => {
                    this.growl.error("Revert not completed - Error: " + reason.message);
                }).finally(() => {
                    this.oking = false;
            });
        }
        cancel() {
            this.dismiss();
        }
    }
}

veCore.component(RevertConfirmComponent.selector,RevertConfirmComponent);