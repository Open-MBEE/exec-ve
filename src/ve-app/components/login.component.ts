import * as angular from "angular";
import {StateService} from "@uirouter/angularjs";

import {AuthService, RootScopeService} from "@ve-utils/services";
import {VeComponentOptions} from "@ve-types/view-editor";

import {veApp} from "@ve-app";

let LoginComponent: VeComponentOptions = {
    selector: 'login',
    template: `
    <div id="ve-login" class="row">
    <div class="account-wall">
        <div>
            <img src="img/logo-large.svg" alt="Program Logo">
        </div>
        <div>
            <form name="loginForm" ng-submit="$ctrl.login(credentials)">
                <span class="label-text">Username:</span>
                <input type="text" class="form-control login-input" ng-model="credentials.username" autofocus>
                <span class="label-text">Password:</span>
                <input type="password" class="form-control login-input" ng-model="credentials.password">
                <button class="btn btn-block btn-primary" type="submit">Log In
                    <span ng-if="$ctrl.spin" ><i class="fa fa-spin fa-spinner"></i></span>
                </button>
            </form>
        </div>
        
        <login-banner mms-login-banner="$ctrl.loginBanner"></login-banner>
    </div>
</div>
`,
    bindings: {
        mmsLoginBanner: '<',
        paramsOb: '<'
    },
    controller: class LoginController implements angular.IComponentController {
        static $inject = ['$state', 'growl', 'AuthService', 'RootScopeService'];
        
        public spin = false;
                pageTitle = 'View Editor';
                loginBanner;

        private mmsLoginBanner;

        
        constructor(private $state: StateService, private growl: angular.growl.IGrowlService, private authSvc: AuthService, private rootScopeSvc: RootScopeService) {}
            
        $onInit() {
            this.rootScopeSvc.veTitle('Login');
            this.loginBanner = this.mmsLoginBanner;
        }
        
        login(credentials) {
            this.spin = true;
            if (!credentials || !credentials.password || !credentials.username) {
                let message = 'Missing: '
                message+= (!credentials || !credentials.username) ? 'Username' : '';
                message+= (!credentials) ? ' and ' : '';
                message+= (!credentials || !credentials.password) ? 'Password' : '';
                this.growl.error(message);
            }
            else {
                var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                this.authSvc.getAuthorized(credentialsJSON)
                    .then((user) => {
                        if (this.rootScopeSvc.veRedirect()) {
                            let veRedirect = this.rootScopeSvc.veRedirect();
                            var toState = veRedirect.toState;
                            var toParams = veRedirect.toParams;
                            this.$state.go(toState, toParams);
                        } else {
                            this.$state.go('main.login.select', {fromLogin: true});
                        }
                    }, (reason) => {
                        this.spin = false;
                        this.growl.error(reason.message);
                    }).finally(() => {
                        this.rootScopeSvc.veRedirect(null)
                })
            }
        }
    }
}

veApp.component(LoginComponent.selector,LoginComponent);