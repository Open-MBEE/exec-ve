import angular from 'angular';
import _ from 'lodash';

import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veCore } from '@ve-core';

import { VeComponentOptions, VePromise } from '@ve-types/angular';
import { RefsResponse } from '@ve-types/mms';
import { VeModalController, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface ConfirmDeleteModalResolve extends VeModalResolve {
    getType: string;
    getName: string;
    finalize(): VePromise<void, RefsResponse>;
}

export interface ConfirmDeleteModalResolveFn extends VeModalResolveFn {
    getType(): string;
    getName(): string;
    finalize(): () => VePromise<void, RefsResponse>;
}

const ConfirmDeleteModalComponent: VeComponentOptions = {
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
        modalInstance: '<',
        resolve: '<',
    },
    controller: class ConfirmDeleteModalController extends VeModalControllerImpl<string> implements VeModalController {
        static $inject = ['growl'];

        protected resolve: ConfirmDeleteModalResolve;

        //local
        public oking: boolean;
        public type: string;
        public name: string;

        constructor(private growl: angular.growl.IGrowlService) {
            super();
        }

        $onInit(): void {
            this.oking = false;
            this.type = this.resolve.getType;
            this.name = this.resolve.getName;
        }

        ok = (): void => {
            if (this.oking) {
                this.growl.info('Please wait...');
                return;
            }
            this.oking = true;
            if (this.resolve.finalize) {
                this.resolve.finalize().then(
                    () => {
                        this.growl.success(_.upperFirst(this.type) + ' Removed');
                        this.oking = false;
                        this.modalInstance.close('ok');
                    },
                    (reason) => {
                        if (reason.message) {
                            this.growl.error(this.type + ' Removal Error: ' + reason.message);
                        }
                        this.oking = false;
                        this.modalInstance.dismiss();
                    }
                );
            }
        };

        cancel(): void {
            this.modalInstance.dismiss();
        }
    },
};

veCore.component(ConfirmDeleteModalComponent.selector, ConfirmDeleteModalComponent);
