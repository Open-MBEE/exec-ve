import * as angular from "angular";
import Rx from 'rx-lite';
import {StateService, TransitionService, UIRouter, UIRouterGlobals} from "@uirouter/angularjs";
import {AuthService, EventService, ProjectService, RootScopeService} from "@ve-utils/services";
import {ngStorage} from "ngstorage";
import {VeComponentOptions} from "@ve-types/view-editor";

import {veApp} from "@ve-app";

let SelectComponent: VeComponentOptions = {
    selector: 'projectSelect',
    template: `
    <div id="ve-origin-select" class="row">
    <div class="account-wall-lg" ng-if="$ctrl.redirect_from_old">
        <h2>This is not a valid link</h2>
        <div class="flex">
            <div class="two-thirds-flex">
                <h4>Please navigate to your document by selecting the corresponding organization and project to continue.</h4>
            </div>
            <div class="one-third-flex">
                <form name="loginForm" ng-submit="$ctrl.continue()">
                    <div class="btn-group ve-dark-dropdown-wide" uib-dropdown>
                        <span class="label-dropdown">Org:</span>
                        <button type="button" class="dropdown-toggle" uib-dropdown-toggle>
                            <span>{{ $ctrl.selectedOrg }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                        </button>
                        <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu">
                            <li ng-model="$ctrl.selectedOrg" ng-repeat="org in $ctrl.orgs | orderBy: 'name'" ng-click="$ctrl.selectOrg(org)"
                            ng-class="{'checked-list-item': org.name === $ctrl.selectedOrg}">{{ org.name }}</li>
                        </ul>
                    </div>
                    <div class="btn-group ve-dark-dropdown-wide" uib-dropdown>
                        <span class="label-dropdown">Project:</span>
                        <button type="button" class="dropdown-toggle" uib-dropdown-toggle ng-disabled="!$ctrl.selectedOrg || !$ctrl.projects.length">
                            <span ng-hide="projects.length || !selectedOrg">No Projects for selected Org</span>
                            <span ng-show="projects.length">{{ $ctrl.selectedProject }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                        </button>
                        <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu">
                            <li ng-model="$ctrl.selectedProject" ng-repeat="project in $ctrl.projects | orderBy: 'name'"
                                ng-class="{'checked-list-item': project.name === $ctrl.selectedProject}"
                                ng-click="$ctrl.selectProject(project)">{{ project.name }}
                            </li>
                        </ul>
                    </div>
                    <button class="btn btn-block btn-primary" type="submit"  ng-disabled="!$ctrl.selectedProject || !s$ctrl.electedOrg">Continue
                        <span ng-if="spin"><i class="fa fa-spin fa-spinner"></i></span>
                    </button>
                </form>
            </div>
        </div>
    </div>
    <div class="account-wall" ng-if="!$ctrl.redirect_from_old">
        <div ng-class="{'fade-in': $ctrl.fromLogin}">
            <a class="select-logout-button" ng-click="$ctrl.logout()">
                <div>
                    <span ng-if="$ctrl.logout_spin"><i class="fa fa-spin fa-spinner"></i></span>
                    <span ng-if="!$ctrl.logout_spin"><i class="fa fa-arrow-left back-to-account" aria-hidden="true"></i>
                </div>
            </a>
            <img src="img/logo-large.svg" alt="Program Logo">
        </div>
        <div ng-class="{'animated-fade-in-slide': $ctrl.fromLogin}">
            <form name="loginForm" ng-submit="$ctrl.continue()">
                <div class="btn-group ve-dark-dropdown-wide" uib-dropdown>
                    <span class="label-dropdown">Org:</span>
                    <button type="button" class="dropdown-toggle" uib-dropdown-toggle>
                        <span>{{ $ctrl.selectedOrg }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                    </button>
                    <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu">
                        <li ng-model="$ctrl.selectedOrg" ng-repeat="org in $ctrl.orgs | orderBy: 'name'" ng-click="$ctrl.selectOrg(org)"
                        ng-class="{'checked-list-item': org.name === $ctrl.selectedOrg}">{{ org.name }}</li>
                    </ul>
                </div>
                <div class="btn-group ve-dark-dropdown-wide" uib-dropdown>
                    <span class="label-dropdown">Project:</span>
                    <button type="button" class="dropdown-toggle" uib-dropdown-toggle ng-disabled="!$ctrl.selectedOrg || !$ctrl.projects.length">
                        <span ng-hide="$ctrl.projects.length || !$ctrl.selectedOrg">No Projects for selected Org</span>
                        <span ng-show="$ctrl.projects.length">{{ $ctrl.selectedProject }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                    </button>
                    <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu">
                        <li ng-model="$ctrl.selectedProject" ng-repeat="project in $ctrl.projects | orderBy: 'name'"
                            ng-class="{'checked-list-item': project.name === $ctrl.selectedProject}"
                            ng-click="$ctrl.selectProject(project)">{{ project.name }}
                        </li>
                    </ul>
                </div>
                <button class="btn btn-block btn-primary" type="submit" ng-disabled="!$ctrl.selectedProject || !$ctrl.selectedOrg">Continue
                    <span ng-if="$ctrl.spin"><i class="fa fa-spin fa-spinner"></i></span>
                </button>
            </form>
        </div>

        <login-banner mms-login-banner="$ctrl.loginBanner"></login-banner>
    </div>
</div>
`,
    bindings: {
        mmsOrgs: '<',
        mmsLoginBanner: '<'
    },
    controller: class SelectController implements angular.IComponentController {
        static $inject = ['$uiRouter', '$transitions', '$state', '$localStorage', 'growl', 'ProjectService',
            'AuthService', 'RootScopeService', 'EventService']

        //injectables
        private $uiRouterGlobals: UIRouterGlobals = this.$uiRouter.globals;
        public subs: Rx.IDisposable[];

        //bindings
        public mmsOrgs
        mmsLoginBanner

        //local
        public redirect_from_old
        pageTitle: string
        fromLogin
        spin: boolean = false
        logout_spin: boolean = false
        orgs: object
        projects: object
        orgId: string
        projectId: string
        selectedOrg: string
        selectedProject: string
        loginBanner: object

        constructor(private $uiRouter : UIRouter, private $transitions: TransitionService, private $state: StateService,
                    private $localStorage: ngStorage.StorageService, private growl, private projectSvc: ProjectService, private authSvc: AuthService,
                    private rootScopeSvc: RootScopeService, private eventSvc: EventService) {

        }

        $onInit() {
            this.loginBanner = this.mmsLoginBanner;
            this.eventSvc.$init(this);
            this.rootScopeSvc.veTitle('View Editor'); //what to name this?
            this.redirect_from_old = this.rootScopeSvc.veRedirectFromOld();

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VEREDIRECTFROMOLD, (data) => {
                this.redirect_from_old = data;
            }));
            this.rootScopeSvc.veTitle('Projects');
            this.pageTitle = 'View Editor';
            this.fromLogin = this.$uiRouterGlobals.params.fromLogin;
            this.$localStorage.$default({org: this.mmsOrgs[0]});
            this.orgs = this.mmsOrgs;
            if (this.$localStorage.org) {
                this.selectOrg(this.$localStorage.org);
            }
        }

        public selectOrg(org) {
            if (org) {
                this.$localStorage.org = org;
                this.orgId = org.id;
                this.$localStorage.org.orgName = org.name;
                this.selectedOrg = this.$localStorage.org.name;
                this.selectedProject = "$resolve.Ob"; // default here?
                this.projectSvc.getProjects(this.orgId).then((data) =>{
                    this.projects = data;
                    if (data && data.length > 0) {
                        if(this.$localStorage.project && this.checkForProject(data, this.$localStorage.project) === 1){
                            this.selectedProject = this.$localStorage.project.name;
                            this.projectId = this.$localStorage.project.id;
                        }else{
                            this.selectProject(data[0]);
                        }
                    }
                });
            }
        };

        public selectProject(project) {
            if (project) {
                this.$localStorage.project = project;
                this.selectedProject = this.$localStorage.project.name;
                this.projectId = this.$localStorage.project.id;
            }
        };

        public checkForProject(projectArray, project) {
            for (var i = 0; i < projectArray.length; i++) {
                if(projectArray[i].id === project.id){
                    return 1;
                }
            }
            return 0;
        };

        public continue() {
            if (this.orgId && this.projectId) {
                this.spin = true;
                this.rootScopeSvc.veRedirectFromOld(false);
                this.$state.go('main.project.ref', {orgId: this.orgId, projectId: this.projectId, refId: 'master'}).then((data) => {
                }, (reject) => {
                    this.spin = false;
                });
            }
        };
        public logout() {
            this.logout_spin = true;
            this.authSvc.logout().then(() => {
                this.$state.go('main.login',{});
            }, () => {
                this.growl.error('You were not logged out');
            }).finally(() => {
                this.logout_spin = false;
            });
        };
    }
}

veApp.component(SelectComponent.selector, SelectComponent);
