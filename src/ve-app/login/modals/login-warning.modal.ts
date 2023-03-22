import { RootScopeService } from '@ve-utils/application'
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller'

import { veApp } from '@ve-app'

import { VeModalComponent, VeModalController } from '@ve-types/view-editor'

class LoginWarningModalController extends VeModalControllerImpl<boolean> implements VeModalController {
    static $inject = ['RootScopeService']

    constructor(private rootScopeSvc: RootScopeService) {
        super()
    }

    $onInit(): void {
        if (this.rootScopeSvc.veWarningOk()) {
            this.modalInstance.dismiss()
        }
    }

    continue(): void {
        this.rootScopeSvc.veWarningOk(true)
        this.modalInstance.close(true)
    }

    cancel = (): void => {
        this.modalInstance.dismiss(false)
    }
}

const LoginWarningModal: VeModalComponent = {
    selector: 'loginWarningModal',
    template: `
    <div class="modal-header">
    <h4>Warning</h4>
</div>
<div class="modal-body">
    By accessing and using this information system, you acknowledge and consent to the following:
    
    This service is funded by the United States Government and operated by the 
    California Institute of Technology in support of ongoing U.S. Government programs and activities. 
    If you are not authorized to access this system, disconnect now. Users of this system have no expectation 
    of privacy. By continuing, you consent to your keystrokes and data content being monitored.
    
<!--    You are accessing a U.S. Government information system, which includes: (1) this computer; (2) this computer network; -->
<!--    (3) all computers connected to this network including end user systems; (4) all devices and storage media attached -->
<!--    to this network or to any computer on this network; and (5) cloud and remote information services. -->
<!--    This information system is provided for U.S. Government-authorized use only. -->
<!--    You have no reasonable expectation of privacy regarding any communication transmitted through or data stored on this information system. -->
<!--    At any time, and for any lawful purpose, the U.S. Government may monitor, intercept, search, and seize any communication or data -->
<!--    transiting, stored on, or traveling to or from this information system. You are NOT authorized to process classified -->
<!--    information on this information system. -->
<!--    -->
<!--    Unauthorized or improper use of this system may result in suspension or loss of access privileges, -->
<!--    disciplinary action, and civil and/or criminal penalties. -->
        
</div>
<div class="modal-footer">
    <button class="btn btn-default" ng-click="$ctrl.continue()">Continue</button>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: LoginWarningModalController,
}

veApp.component(LoginWarningModal.selector, LoginWarningModal)
