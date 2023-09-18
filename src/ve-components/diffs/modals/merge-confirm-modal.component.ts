import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veComponents } from '@ve-components';

import { RefObject } from '@ve-types/mms';
import { VeModalComponent, VeModalController, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface MergeConfirmResolve extends VeModalResolve {
    getSrcRefOb: RefObject;
    getDocName: string;
}
export interface MergeConfirmResolveFn extends VeModalResolveFn {
    getSrcRefOb(): RefObject;
    getDocName(): string;
}

class MergeConfirmModalController extends VeModalControllerImpl<void> implements VeModalController {
    //Bindings
    protected resolve: MergeConfirmResolve;

    oking: boolean;
    commitMessage: string;
    createForm: boolean;
    srcRefOb: RefObject;
    docName: string;

    static $inject = ['growl'];

    constructor(private growl: angular.growl.IGrowlService) {
        super();
    }

    $onInit(): void {
        this.srcRefOb = this.resolve.getSrcRefOb;
        this.docName = this.resolve.getDocName;
        this.oking = false;
        this.commitMessage = '';
        this.createForm = true;
    }

    public ok = (): void => {
        if (this.oking) {
            this.growl.info('Please wait...');
            return;
        }
        this.oking = false;
    };

    public cancel = (): void => {
        this.modalInstance.dismiss();
    };
}

const MergeConfirmModalComponent: VeModalComponent = {
    selector: 'mergeConfirmModal',
    template: `
    <div class="modal-header">
    <h4>Pull in changed presentation elements <span class="text-warning">(beta)</span></h4>
</div>

<div class="modal-body revert-dialogue">
    <p><b>{{$ctrl.docName}}:</b> Pull in changed Presentation Elements from <span class="{{$ctrl.srcRefOb.type}}-icon"><b>{{$ctrl.srcRefOb.name}}</b></span> to <span class="{{$ctrl.currentRefOb.type}}-icon"><b>{{$ctrl.currentRefOb.name}}</b></p>

    <p style="padding-bottom:20px;"> This will commit contents of source Presentation Elements (PEs)<a><i class="fa fa-question-circle" uib-tooltip="Text, image, equation, and section elements" tooltip-placement="bottom"></i></a> to target PEs if source PEs have changed, and add new PEs from source to target if they do not exist on target.
        <!-- <a> More...</a> -->
    </p>

    <div class="element-preview-box">
        <p><i class="fa fa-exclamation-triangle"></i><b>Notice:</b> Your document may not
            look complete unless your model merge was completed as well.
        </p>
        <p><i class="fa fa-exclamation-triangle"></i><b>Before applying to your production
            branch</b> please <a>create a test branch</a> from your target branch, apply changes, and preview.</p>
    </div>
    <label>Optional change log message</label>
    <div class="commit-message-box">
        <textarea ng-model="$ctrl.commitMessage" style="width:100%" rows="3" placeholder="Describe your changes"></textarea>
    </div>
</div>

<div class="modal-footer">
    <button class="btn btn-warning" ng-click="$ctrl.ok()">Pull</button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: MergeConfirmModalController,
};

veComponents.component(MergeConfirmModalComponent.selector, MergeConfirmModalComponent);
