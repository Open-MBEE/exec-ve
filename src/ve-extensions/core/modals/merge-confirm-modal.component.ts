import * as angular from 'angular';

import {VeModalComponent, VeModalController, VeModalResolve, VeModalResolveFn} from "@ve-types/view-editor";
import {VeModalControllerImpl} from "@ve-utils/modals/ve-modal.controller";
import {veExt} from "@ve-ext";

export interface MergeConfirmResolve extends VeModalResolve {}
export interface MergeConfirmResolveFn extends VeModalResolveFn {}

class MergeConfirmModalController extends VeModalControllerImpl implements VeModalController {

    oking: boolean
    commitMessage: string;
    createForm: boolean;

    static $inject = ['growl'];

    constructor(private growl: angular.growl.IGrowlService) {
        super();
    }

    $onInit() {
        this.oking = false;
        this.commitMessage = '';
        this.createForm = true;
    }


    public ok = () => {
        if (this.oking) {
            this.growl.info("Please wait...");
            return;
        }
        this.oking = false;
    };

    public cancel = () => {
        this.modalInstance.dismiss();
    }
}

let MergeConfirmModalComponent: VeModalComponent = {
    selector: "mergeConfirmModal",
    template: `
    <div class="modal-header">
    <h4>Pull in changed presentation elements <span class="text-warning">(beta)</span></h4>
</div>

<div class="modal-body revert-dialogue">
    <p><b>{{docName}}:</b> Pull in changed Presentation Elements from <span class="{{srcRefOb.type}}-icon"><b>{{srcRefOb.name}}</b></span> to <span class="{{currentRefOb.type}}-icon"><b>{{currentRefOb.name}}</b></p>

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
        <textarea ng-model="commitMessage" style="width:100%" rows="3" placeholder="Describe your changes"></textarea>
    </div>
</div>

<div class="modal-footer">
    <button class="btn btn-warning" ng-click="ok()">Pull</button>
    <button class="btn btn-default" ng-click="cancel()">Cancel</button>
</div>
`,
    bindings: {
        modalInstance: "<",
        resolve: "<"
    },
    controller: MergeConfirmModalController
}

veExt.component(MergeConfirmModalComponent.selector, MergeConfirmModalComponent);
