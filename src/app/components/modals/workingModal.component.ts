import * as angular from 'angular';

var mmsApp = angular.module('mmsApp');

let WorkingModalComponent: angular.ve.ComponentOptions = {
    selector: 'workingModal',
    template: `
    <div class="modal-header">Please come back later</div>
<div class="modal-body">
    The document you're requesting has been requested already at {{$ctrl.workingTime.startTime | date:'M/d/yy h:mm a'}} and is currently being cached, please try again later.
</div> 
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class WorkingModalController implements angular.IComponentController {

        //bindings
        private dismiss
                close
                resolve

        public workingTime

        constructor() {
        }

        $onInit() {
            this.workingTime = this.resolve.getWorkingTime();

        }
    }
}

mmsApp.component(WorkingModalComponent.selector, WorkingModalComponent);