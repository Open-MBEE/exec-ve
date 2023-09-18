import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { VeModalController, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface WorkingTimeObject {
    startTime: Date;
}

export interface WorkingTimeModalResolveFn extends VeModalResolveFn {
    getWorkingTime(): WorkingTimeObject;
}

interface WorkingTimeModalResolve extends VeModalResolve {
    getWorkingTime: WorkingTimeObject;
}

const WorkingModalComponent: VeComponentOptions = {
    selector: 'workingModal',
    template: `
    <div class="modal-header">Please come back later</div>
<div class="modal-body">
    The document you're requesting has been requested already at {{$ctrl.workingTime.startTime | date:'M/d/yy h:mm a'}} and is currently being cached, please try again later.
</div> 
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: class WorkingModalController
        extends VeModalControllerImpl<void, WorkingTimeModalResolve>
        implements VeModalController
    {
        public workingTime;

        $onInit(): void {
            this.workingTime = this.resolve.getWorkingTime;
        }
    },
};

veApp.component(WorkingModalComponent.selector, WorkingModalComponent);
