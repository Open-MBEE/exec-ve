import { IComponentController } from 'angular';

import { veAdmin } from '@ve-admin/ve-admin.module';
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { VeModalComponent, VeModalInstanceService, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

interface WarningModalResolve extends VeModalResolve {
    message: string;
}

export interface WarningModalResolveFn extends VeModalResolveFn {
    message(): string;
}

const WarningModalComponent: VeModalComponent = {
    selector: 'warningModal',
    template: `
    <div class="modal-header"> 
    <h4>Warning</h4>
</div>

<div class="modal-body">
    <p>{{ $ctrl.message }}</p>
</div>

<div class="modal-footer">
    <button class="btn btn-danger" ng-click="$ctrl.ok()">Continue</button>
    <button class="btn btn-secondary" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: class WarningModalController
        extends VeModalControllerImpl<void, WarningModalResolve>
        implements IComponentController
    {
        static $inject = ['ApiService'];

        //bindings
        public modalInstance: VeModalInstanceService<void>;

        //local
        private message: string;

        constructor() {
            super();
        }

        $onInit(): void {
            this.message = this.resolve.message;
        }

        cancel(): void {
            this.modalInstance.dismiss();
        }

        ok(): void {
            this.modalInstance.close();
        }
    },
};

veAdmin.component(WarningModalComponent.selector, WarningModalComponent);
