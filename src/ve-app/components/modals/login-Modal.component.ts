import angular from "angular";
import * as _ from "lodash";
import {AuthService} from "../../../ve-utils/services/Authorization.service";
import {EditService} from "../../../ve-utils/services/Edit.service";
import {UtilsService} from "../../../ve-utils/services/Utils.service";
import {CacheService} from "../../../ve-utils/services/Cache.service";
import {VeComponentOptions} from "../../../ve-utils/types/view-editor";

var veApp = angular.module('veApp');

let LoginModalComponent: VeComponentOptions = {
    selector: 'loginModal',
    template: `
    <div class="modal-header">
    <h4>You have been logged out, please login again.</h4>
</div>
<div class="modal-body">
    <form name="loginForm" ng-submit="$ctrl.login(credentials)">
        <input type="text" class="form-control" ng-model="$ctrl.credentials.username" placeholder="Username" style="margin-bottom: 1.5em;" autofocus>
        <input type="password" class="form-control" ng-model="$ctrl.credentials.password" placeholder="Password" style="margin-bottom: 1.5em;">
        <button class="btn btn-block btn-primary" type="submit">
            LOG IN <span ng-if="$ctrl.spin" ><i class="fa fa-spin fa-spinner"></i></span>
        </button>
    </form>
</div>
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class LoginModalController implements angular.IComponentController {

        static $inject = ['$state', 'growl', 'AuthService', 'EditService', 'UtilsService', 'CacheService'];

        private dismiss
                close

        public credentials = {
                    username: '',
                    password: ''
                };
                spin = false;

        constructor(private $state, private growl, private authSvc: AuthService, private editSvc: EditService,
                    private utilsSvc: UtilsService, private cacheSvc: CacheService) {
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
                    this.$state.go(this.$state.current, {}, {reload: true});
                    this.dismiss();
                }, (reason) => {
                    this.spin = false;
                    this.credentials.password = '';
                    this.growl.error(reason.message);
                });
            };
    }
}

veApp.component(LoginModalComponent.selector,LoginModalComponent);