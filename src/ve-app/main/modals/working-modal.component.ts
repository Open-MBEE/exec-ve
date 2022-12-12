import angular from 'angular'

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'

const WorkingModalComponent: VeComponentOptions = {
    selector: 'workingModal',
    template: `
    <div class="modal-header">Please come back later</div>
<div class="modal-body">
    The document you're requesting has been requested already at {{$ctrl.workingTime.startTime | date:'M/d/yy h:mm a'}} and is currently being cached, please try again later.
</div> 
`,
    bindings: {
        close: '<',
        dismiss: '<',
        modalInstance: '<',
        resolve: '<',
    },
    controller: class WorkingModalController
        implements angular.IComponentController
    {
        //bindings
        private dismiss
        close
        resolve

        public workingTime

        constructor() {}

        $onInit(): void {
            this.workingTime = this.resolve.getWorkingTime()
        }
    },
}

veApp.component(WorkingModalComponent.selector, WorkingModalComponent)
