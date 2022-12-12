import angular, { IComponentController } from 'angular'

import { ApplicationService } from '@ve-utils/services'

import { veApp } from '@ve-app'

import { VeComponentOptions } from '@ve-types/angular'
import { VeModalInstanceService } from '@ve-types/view-editor'

const AboutModalComponent: VeComponentOptions = {
    selector: 'aboutModal',
    template: `
    <div class="modal-header">
    <h4>About</h4>
</div>

<div class="modal-body">
    <p>MMS Version : <b>{{$ctrl.mmsV}}</b></p>
    <p>View Editor Version : <b>{{$ctrl.veV}}</b></p>
</div>

<div class="modal-footer">
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Close</button>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '@',
    },
    controller: class AboutModalController implements IComponentController {
        static $inject = ['ApplicationService']

        //bindings
        public modalInstance: VeModalInstanceService<void>
        public resolve

        //local
        public veV
        public mmsV

        constructor(private applicationSvc: ApplicationService) {}

        $onInit(): void {
            this.veV = window.__env.version ? window.__env.version : '3.6.1'
            this.mmsV = 'Loading...'

            this.applicationSvc.getMmsVersion().then(
                (data) => {
                    this.mmsV = data
                },
                (reason) => {
                    this.mmsV =
                        'Could not retrieve due to failure: ' + reason.message
                }
            )
        }

        cancel(): void {
            this.modalInstance.dismiss()
        }
    },
}

veApp.component(AboutModalComponent.selector, AboutModalComponent)
