import * as angular from 'angular';
import {StateService, UIRouter, UIRouterGlobals} from '@uirouter/angularjs';
import {AuthService} from "@ve-utils/mms-api-client";
import {ApplicationService, EventService, RootScopeService} from "@ve-utils/services";
import {VeComponentOptions, VeModalService} from "@ve-types/view-editor";

import {veApp} from "@ve-app";


let VeNavComponent: VeComponentOptions = {
    selector: "veNav",
    bindings: {
        mmsOrg: '<',
        mmsOrgs: '<',
        mmsProject: '<',
        mmsProjects: '<',
        mmsRef: '<',
    },
    template: `
    <nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
    <div class="block">
        <div class="navbar-header">
            <button type="button" class="navbar-toggle main-nav-toggle" ng-click="$ctrl.isNavCollapsed = !$ctrl.isNavCollapsed">
                <span class="sr-only">Toggle navigation</span>
                <i class="fa fa-bars" aria-hidden="true"></i>
            </button>
            <span>
            <a class="navbar-brand" ui-sref="main.login.select">
                <img src="img/logo.svg" alt="View Editor Logo">
            </a>
            <a ng-if="!$ctrl.mmsOrg.homeLink" class="org-title" ui-sref="'main.project.ref.portal({projectId: $ctrl.mmsProject.id, refId: $ctrl.mmsRef.id})">{{ $ctrl.mmsOrg.name }}</a>
            <a ng-if="$ctrl.mmsOrg.homeLink" class="org-title" ng-href="{{$ctrl.mmsOrg.homeLink}}">{{ $ctrl.mmsOrg.name }}</a>
            <a class="switch-org" ng-click="$ctrl.updateOrg()">Switch Org</a>
            </span>
        </div>
        <div class="collapse navbar-collapse" uib-collapse="$ctrl.isNavCollapsed" id="global-navigation">
            <form id="global-search" ng-show="$ctrl.showSearch" ng-submit="$ctrl.search(searchText)" class="navbar-form navbar-left" role="search">
                <div class="form-group">
                    <input placeholder="Search selected project" ng-model="searchText"/>
                    <button ng-click="$ctrl.search(searchText)">
                        <i class="fa fa-search" aria-hidden="true"></i>
                    </button>
                </div>
            </form>
            <ul class="nav navbar-nav global-menu">
                <li class="dropdown">
                    <span class="dropdown ve-dark-dropdown-nav fixed-content-dropdown" uib-dropdown on-toggle="$ctrl.toggled(open)">
                        <a href id="help-dropdown" class="dropdown-toggle" uib-dropdown-toggle>
                        Help <i class="fa fa-caret-down" aria-hidden="true"></i>
                        </a>
                        <ul class="dropdown-menu pull-right" uib-dropdown-menu aria-labelledby="help-dropdown">
                            <li>
                                <a href="" ng-click="$ctrl.toggleHelp()">Keyboard Shortcuts</a>
                            </li>
                            <li class="divider"></li>
                            <li>
                                <a href="https://github.com/Open-MBEE/ve/blob/develop/Documents/ViewEditorUserGuide.pdf" target="_blank">View Editor Help</a>
                            </li>
                            <li>
                                <a href="https://openmbee.atlassian.net/secure/Dashboard.jspa" target="_blank">Report Issue</a>
                            </li>
                            <li class="divider"></li>
                            <li class="list-section-bottom">
                                <a ng-click="$ctrl.toggleAbout()" href="">About View Editor</a>
                            </li>
                         </ul>
                    </span>
                </li>
                <li class="dropdown">
                    <span class="dropdown ve-dark-dropdown-nav fixed-content-dropdown user-profile" uib-dropdown on-toggle="$ctrl.toggled(open)">
                        <a href id="login-dropdown" class="dropdown-toggle" uib-dropdown-toggle>
                            <div>{{ $ctrl.userBadge }}</div>
                        </a>
                        <ul class="dropdown-menu pull-right" uib-dropdown-menu aria-labelledby="login-dropdown" style="white-space: nowrap" role="login-menu">
                            <li ng-if="$ctrl.username" class="ve-secondary">
                                Logged in as <b ng-if="$ctrl.user.firstName !== undefined">{{ $ctrl.user.firstName }} {{ $ctrl.user.lastName }}</b> ({{ $ctrl.username }})
                            </li>
                            <li class="divider"></li>
                            <li>
                                <a ng-click="$ctrl.logout()">Log Out</a>
                            </li>
                         </ul>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</nav>
`,
    controller: class VeNavController implements angular.IComponentController {
        static $inject = ['$uiRouter', '$state', '$location', '$uibModal', '$window', 'hotkeys', 'growl', 'ApplicationService',
            'AuthService', 'EventService', 'RootScopeService'];

        //bindings
        public mmsOrg;
        public mmsProject;
        public mmsProjects;
        public mmsRef;
        public mmsOrgs;

        //injectables
        public subs: Rx.IDisposable[];

        //local
        public isNavCollapsed;
        public about;
        public searchClass;
        public username;
        public user;
        public userBadge: string;

        protected showSearch: boolean = true;

        constructor(private $uiRouter: UIRouter, private $state: StateService, private $location: angular.ILocationService,
                    private $uibModal: VeModalService, private $window: angular.IWindowService,
                    private hotkeys: angular.hotkeys.HotkeysProvider, private growl: angular.growl.IGrowlService,
                    private applicationSvc: ApplicationService, private authSvc: AuthService,
                    private eventSvc: EventService, private rootScopeSvc: RootScopeService) {
            this.isNavCollapsed = true;

            this.searchClass = "";
        }

        $onInit() {
            this.eventSvc.$init(this);

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.VESHOWSEARCH, (data: boolean) => {
               this.showSearch = data;
            }));

            this.authSvc.checkLogin().then((data) => {
                this.username = data.username;
                this.authSvc.getUserData(data.username).then((userData) => {
                    this.user = userData;
                    if (this.user.firstName) {
                        this.userBadge = this.user.firstName.substring(0,1).toUpperCase();
                        this.userBadge+= this.user.lastName.substring(0,1).toUpperCase();
                    }else {
                        this.userBadge = (this.user.username) ? this.user.username.substring(0,2).toUpperCase() : "VE";
                    }
                },() => {
                    this.user = data.username;
                    this.userBadge = this.username.substring(0,1).toUpperCase()
                });
            });


        }

        updateOrg() {
            this.$uibModal.open({
                    component: 'selectModal',
                    windowClass: 've-dropdown-short-modal',
                    resolve: {
                        mmsOrgs: () => {
                            return this.mmsOrgs;
                        },
                        mmsOrg: () => {
                            return this.mmsOrg;
                        },
                        mmsProjects: () => {
                            return this.mmsProjects;
                        },
                        mmsProject: () => {
                            return this.mmsProject;
                        }
                    },
            });

        };

        toggleHelp() {
            this.hotkeys.toggleCheatSheet();
        };

        toggleAbout() {
            this.$uibModal.open({
                component: 'aboutModal'
            });
        };

        logout() {
            this.authSvc.logout().then(() => {
                this.$state.go('main.login');
            },() => {
                this.growl.error('You were not logged out');
            });
        };

        search(searchText) {
            if (this.$state.includes('main.project.ref.document.order')) {
                this.growl.warning("Please finish reorder action first.");
                return;
                // } else if ($state.includes('main.project.diff')) {
                //     growl.warning("Please finish diff action first.");
                //     return;
            } else {
                this.searchClass = "fa fa-spin fa-spinner";
                this.$state.go('main.project.ref.search', {search: searchText, field: 'all'});
            }
        };

    }
};

veApp.component(VeNavComponent.selector,VeNavComponent);
