import { StateService, UIRouterGlobals } from '@uirouter/angularjs';
import angular from 'angular';

import { AuthService } from '@ve-utils/mms-api-client';
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veApp } from '@ve-app';

import { AuthRequest } from '@ve-types/mms';
import { VeModalComponent, VeModalController, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface LoginModalResolveFn extends VeModalResolveFn {
    continue(): boolean;
}

export interface LoginModalResolve extends VeModalResolve {
    continue: boolean;
}

class LoginModalController extends VeModalControllerImpl<boolean, LoginModalResolve> implements VeModalController {
    static $inject = ['$state', '$uiRouterGlobals', 'growl', 'AuthService'];

    public credentials = {
        username: '',
        password: '',
    };
    spin = false;

    constructor(
        private $state: StateService,
        private $uiRouterGlobals: UIRouterGlobals,
        private growl: angular.growl.IGrowlService,
        private authSvc: AuthService
    ) {
        super();
    }

    login(credentials: AuthRequest): void {
        this.spin = true;
        this.authSvc.getAuthorized(credentials).then(
            (user) => {
                this.growl.success('Logged in');
                // Check if user had changes queued before refreshing page data
                // add edits to cache
                // const edits = this.autosaveSvc.getAll()
                // _.map(edits, (element, key) => {
                //     const reqOb = this.apiSvc.makeRequestObject(element)
                //     const cacheKey = this.apiSvc.makeCacheKey(reqOb, element.id, true)
                //     this.cacheSvc.put(cacheKey, element)
                // })
                if (this.resolve.continue) {
                    this.$state.go(this.$uiRouterGlobals.current, {}, { reload: true }).then(
                        () => {
                            this.modalInstance.close(true);
                        },
                        () => {
                            this.growl.error('Redirect error; Please reload the page');
                        }
                    );
                }
            },
            (reason) => {
                this.spin = false;
                this.credentials.password = '';
                this.growl.error(reason.message);
            }
        );
    }

    cancel = (): void => {
        this.modalInstance.dismiss(false);
    };
}

const LoginModalComponent: VeModalComponent = {
    selector: 'loginModal',
    template: `
    <div class="modal-header">
    <h4>You have been logged out, please login again.</h4>
</div>
<div class="modal-body">
    <form name="loginForm" ng-submit="$ctrl.login(credentials)">
        <input type="text" class="form-control" ng-model="credentials.username" placeholder="Username" style="margin-bottom: 1.5em;" autofocus>
        <input type="password" class="form-control" ng-model="credentials.password" placeholder="Password" style="margin-bottom: 1.5em;">
        <button class="btn btn-block btn-primary" type="submit">
            LOG IN <span ng-if="$ctrl.spin" ><i class="fa fa-spin fa-spinner"></i></span>
        </button>
        <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
    </form>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: LoginModalController,
};

veApp.component(LoginModalComponent.selector, LoginModalComponent);
