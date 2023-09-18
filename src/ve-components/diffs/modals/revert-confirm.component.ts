import _ from 'lodash';

import { Commit, CompareData } from '@ve-components/diffs';
import { EventService } from '@ve-utils/core';
import { ElementService } from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { VeComponentOptions } from '@ve-types/angular';
import { ConstraintObject, ElementObject, ElementsRequest, ElementTaggedValueObject, SlotObject } from '@ve-types/mms';
import { VeModalController, VeModalInstanceService } from '@ve-types/view-editor';

export interface RevertConfirmResolve {
    reqOb: ElementsRequest<string>;
    revertData: CompareData;
}

export interface RevertConfirmResolveFn {
    reqOb(): ElementsRequest<string>;
    revertData(): {
        baseCommit: Commit;
        compareCommit: Commit;
        element: ElementObject;
    };
}

class RevertConfirmController implements VeModalController {
    //bindings
    public modalInstance: VeModalInstanceService<void>;
    public resolve: RevertConfirmResolve;

    public oking;
    revertData: CompareData;
    reqOb: ElementsRequest<string>;
    element: ElementObject;

    static $inject = ['growl', 'ElementService', 'EventService'];

    constructor(
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.revertData = this.resolve.revertData;
        this.reqOb = this.resolve.reqOb;
        this.elementSvc.getElement(this.reqOb).then((el) => {
            this.element = el;
        });
    }

    ok(): void {
        if (this.oking) {
            this.growl.info('Please wait...');
            return;
        }
        this.oking = true;

        const reqOb = _.cloneDeep(this.reqOb);
        reqOb.refId = this.revertData.baseCommit.ref.id;
        reqOb.commitId =
            typeof this.revertData.baseCommit.commitSelected === 'string'
                ? this.revertData.baseCommit.commitSelected
                : this.revertData.baseCommit.commitSelected.id;
        this.elementSvc
            .getElement(reqOb, 2, false)
            .then(
                (targetOb) => {
                    const revertOb: ElementObject = {
                        id: this.reqOb.elementId,
                        name: targetOb.name ? targetOb.name : '',
                        type: targetOb.type,
                        documentation: targetOb.documentation,
                        _projectId: this.reqOb.projectId,
                        _refId: this.reqOb.refId,
                    };
                    if (revertOb.type === 'Property' || revertOb.type === 'Port') {
                        revertOb.defaultValue = _.cloneDeep(targetOb.defaultValue);
                    } else if (revertOb.type === 'ElementTaggedValue') {
                        (revertOb as ElementTaggedValueObject).valueIds = _.cloneDeep(
                            (targetOb as ElementTaggedValueObject).valueIds
                        );
                    } else if (revertOb.type === 'Slot' || revertOb.type.endsWith('TaggedValue')) {
                        (revertOb as SlotObject).value = _.cloneDeep((targetOb as SlotObject).value);
                    } else if (revertOb.type === 'Constraint' && revertOb.specification) {
                        (revertOb as ConstraintObject).specification = _.cloneDeep(
                            (targetOb as ConstraintObject).specification
                        );
                    }

                    this.elementSvc.updateElement(revertOb).then(
                        (element) => {
                            const data = {
                                element: element,
                                continueEdit: false,
                            };
                            this.eventSvc.$broadcast('element.updated', data);
                            this.modalInstance.close();
                        },
                        (reason) => {
                            this.growl.error('Revert not completed - Update Error: ' + reason.message);
                        }
                    );
                },
                (reason) => {
                    this.growl.error('Revert not completed - Error: Target Version not found');
                }
            )
            .finally(() => {
                this.oking = false;
            });
    }
    cancel(): void {
        this.modalInstance.dismiss();
    }
}

const RevertConfirmComponent: VeComponentOptions = {
    selector: 'revertConfirm',
    template: `
    <div class="modal-header">
    <h4>Revert element documentation, name, and value</h4>
</div>

<div class="modal-body revert-dialogue">
    <p>Revert documentation, name, and value of this element from 
    <b>{{$ctrl.revertData.compareCommit.commitSelected._creator}} - {{$ctrl.revertData.compareCommit.commitSelected._created | date:'M/d/yy h:mm a'}}</b> on {{$ctrl.revertData.compareCommit.ref.type}}: <b>{{$ctrl.revertData.compareCommit.ref.name}}</b>
    to 
    <b>{{$ctrl.revertData.baseCommit.commitSelected._creator}} - {{$ctrl.revertData.baseCommit.commitSelected._created | date:'M/d/yy h:mm a'}}</b>
    on {{$ctrl.revertData.baseCommit.ref.type}}: <b>{{$ctrl.revertData.baseCommit.ref.name}}</b>.</p>
    <p>This will create a new version under your username on <b>{{$ctrl.revertData.compareCommit.ref.name}}.</b></p>
    <p>Cross reference contents will NOT be reverted.</p>

    <h3>Preview Element</h3>
    <div class="element-preview-box">
        <h1 class="prop element-title">
            <mms-cf mms-cf-type="name" mms-element-id="{{$ctrl.reqOb.elementId}}" mms-project-id="{{$ctrl.reqOb.projectId}}" mms-ref-id="{{$ctrl.revertData.baseCommit.ref.id}}" mms-commit-id="{{$ctrl.revertData.baseCommit.commitSelected.id}}"></mms-cf>
        </h1>
        <h2 class="prop-title spec-view-doc-heading">Documentation</h2>
        <p class="doc-text">
            <mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.reqOb.elementId}}" mms-project-id="{{$ctrl.reqOb.projectId}}" mms-ref-id="{{$ctrl.revertData.baseCommit.ref.id}}" mms-commit-id="{{$ctrl.revertData.baseCommit.commitSelected.id}}"></mms-cf>
        </p>
        <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot' || $ctrl.element.type.endsWith('TaggedValue')">
        <h2 class="prop-title">Property Value</h2>
        <span class="prop">
            <mms-cf mms-cf-type="val" mms-element-id="{{$ctrl.reqOb.elementId}}" mms-project-id="{{$ctrl.reqOb.projectId}}" mms-ref-id="{{$ctrl.revertData.baseCommit.ref.id}}" mms-commit-id="{{$ctrl.revertData.baseCommit.commitSelected.id}}"></mms-cf>
        </span></div>
    </div>
</div>

<div class="modal-footer">
    <button class="btn btn-warning " ng-click="$ctrl.ok()">Revert</button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
  
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: RevertConfirmController,
};

veComponents.component(RevertConfirmComponent.selector, RevertConfirmComponent);
