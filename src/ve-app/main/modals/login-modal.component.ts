import angular from "angular";
import * as _ from "lodash";
import {AuthService, CacheService} from "@ve-utils/mms-api-client"
import {EditService, UtilsService} from "@ve-utils/core-services";
import {VeModalComponent, VeModalController} from "@ve-types/view-editor";

import {veApp} from "@ve-app";
import {VeModalControllerImpl} from "@ve-utils/modals/ve-modal.controller";



let LoginModalComponent: VeModalComponent = {
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
        modalInstance: "<",
        resolve: "<"
    },
    controller: class LoginModalController extends VeModalControllerImpl implements VeModalController {

        static $inject = ['$state', 'growl', 'AuthService', 'EditService', 'UtilsService', 'CacheService'];

        public credentials = {
                    username: '',
                    password: ''
                };
                spin = false;

        constructor(private $state, private growl, private authSvc: AuthService, private editSvc: EditService,
                    private utilsSvc: UtilsService, private cacheSvc: CacheService) {
            super();
        }

        login(credentials) {
                this.spin = true;
                var credentialsJSON = {"username":credentials.username, "password":credentials.password};
                this.authSvc.getAuthorized(credentialsJSON).then((user) => {
                    this.growl.success("Logged in");
                    // Check if user had changes queued before refreshing page data
                    // add edits to cache
                    var edits = this.editSvc.getAll();
                    _.map(edits, (element, key) => {
                        var cacheKey = this.utilsSvc.makeElementKey(element, true);
                        this.cacheSvc.put(cacheKey, element);
                    });
                    if (this.resolve.continue) {
                        this.$state.go(this.$state.current, {}, {reload: true});
                    }
                    this.modalInstance.dismiss(true);
                }, (reason) => {
                    this.spin = false;
                    this.credentials.password = '';
                    this.growl.error(reason.message);
                });
            };

        cancel = () => {
            this.modalInstance.dismiss(false)
        };
    }
}

veApp.component(LoginModalComponent.selector,LoginModalComponent);