import * as angular from 'angular';
import {VeComponentOptions, VeModalController, VeModalResolve, VeModalResolveFn} from "@ve-types/view-editor";

import {veApp} from "@ve-app";
import {VeModalControllerImpl} from "@ve-utils/modals/ve-modal.controller";
import _ from "lodash";

export interface ConfirmDeleteModalResolve extends VeModalResolve {
    getType: string,
    getName: string,
    finalize(): angular.IPromise<boolean>
}

export interface ConfirmDeleteModalResolveFn extends VeModalResolveFn {
    getType(): string,
    getName(): string,
    finalize(): () => angular.IPromise<boolean>
}

let ConfirmDeleteModalComponent: VeComponentOptions = {
    selector: 'confirmDeleteModal',
    template: `
    <div class="modal-header">
    <h4>Confirm Remove</h4>
</div>

<div class="modal-body">
    <p>Are you sure you want to remove {{$ctrl.type}} <b>&ldquo;{{$ctrl.name}}&rdquo;</b>?</p>
    <p ng-if="$ctrl.type === 'edit'">
      There are unsaved modifications to this element, which may include html beautification.<br/>
      Are you sure you want to discard them? 
    </p>
    <p ng-if="$ctrl.type === 'view'">This will remove <b>&ldquo;{{$ctrl.name}}&rdquo;</b> from the hierarchy, but you can still access it in search.</p>
    <p ng-if="$ctrl.type === 'Document' || $ctrl.type === 'group'">This will remove <b>&ldquo;{{$ctrl.name}}&rdquo;</b> from the project navigation, but you can still access it in search.</p>
</div>

<div class="modal-footer">
    <button class="btn btn-warning" ng-click="$ctrl.ok()">Remove <i ng-show="$ctrl.oking" class="fa fa-spin fa-spinner"></i></button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        modalInstance: "<",
        resolve: "<"
    },
    controller: class ConfirmDeleteModalController extends VeModalControllerImpl implements VeModalController {

        static $inject = ['growl'];

        protected resolve: ConfirmDeleteModalResolve;

        //local
        public oking
        public type
        public name

        private treeApi


        constructor(private growl: angular.growl.IGrowlService) {
            super()
        }

        $onInit() {
            this.oking = false;
            this.type = this.resolve.getType;
            this.name = this.resolve.getName;
        }

        ok = () => {
            if (this.oking) {
                this.growl.info("Please wait...");
                return;
            }
            this.oking = true;
            if (this.resolve.finalize) {
                this.resolve.finalize().then(() => {
                        this.growl.success(_.upperFirst(this.type) + " Removed");
                        this.oking = false;
                        this.modalInstance.close({ $value: 'ok'});
                }, (reason) => {
                    if (reason.message) {
                        this.growl.error(this.type + ' Removal Error: ' + reason.message);
                    }
                    this.oking = false;
                    this.modalInstance.dismiss(reason);
                });
            }
        };

        cancel()
        {
            this.modalInstance.dismiss();
        };
    }
};

veApp.component(ConfirmDeleteModalComponent.selector,ConfirmDeleteModalComponent);