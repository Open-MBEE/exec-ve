import { BrandingStyle, RootScopeService } from '@ve-utils/application';
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veApp } from '@ve-app';

import { VeModalComponent, VeModalController, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface LoginWarningResolve extends VeModalResolve {
    loginWarning: BrandingStyle;
}

export interface LoginWarningResolveFn extends VeModalResolveFn {
    loginWarning(): BrandingStyle;
}

class LoginWarningModalController
    extends VeModalControllerImpl<boolean, LoginWarningResolve>
    implements VeModalController
{
    static $inject = ['RootScopeService'];

    private warningMessage: string[];
    private loading: boolean;
    private disabled: boolean;
    private warningHeader: string = 'Warning';

    constructor(private rootScopeSvc: RootScopeService) {
        super();
    }

    $onInit(): void {
        if (Array.isArray(this.resolve.loginWarning.message)) {
            this.warningMessage = this.resolve.loginWarning.message;
        } else this.warningMessage = [this.resolve.loginWarning.message];
        this.disabled = this.resolve.loginWarning.disabled ? this.resolve.loginWarning.disabled : false;
        this.loading = false;
        if (this.rootScopeSvc.veWarningOk() || this.disabled) {
            this.modalInstance.dismiss();
        }
    }

    continue(): void {
        this.rootScopeSvc.veWarningOk(true);
        this.modalInstance.close(true);
    }
}

const LoginWarningModal: VeModalComponent = {
    selector: 'loginWarningModal',
    template: `
    <div class="modal-header">
    <h4 class="warning-header">{{$ctrl.warningHeader}}</h4>
</div>
<div class="modal-body">
    <div ng-repeat="message in $ctrl.warningMessage">{{message}}</div>
</div>
<div class="modal-footer">
    <button class="btn btn-danger" ng-click="$ctrl.continue()">Accept</button>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: LoginWarningModalController,
};

veApp.component(LoginWarningModal.selector, LoginWarningModal);
