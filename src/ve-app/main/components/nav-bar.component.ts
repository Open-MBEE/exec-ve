import { StateService, UIRouter } from '@uirouter/angularjs';

import { SelectModalResolveFn } from '@ve-app/main/modals/select-modal.component';
import { RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { AuthService, UserService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, ProjectObject, RefObject, UserObject } from '@ve-types/mms';
import { VeModalService, VeModalSettings } from '@ve-types/view-editor';

class NavBarController implements angular.IComponentController {
    static $inject = [
        '$uiRouter',
        '$state',
        '$location',
        '$uibModal',
        '$window',
        'hotkeys',
        'growl',
        'AuthService',
        'UserService',
        'EventService',
        'RootScopeService',
    ];

    //bindings
    public mmsOrg: OrgObject;
    public mmsProject: ProjectObject;
    public mmsProjects: ProjectObject[];
    public mmsRef: RefObject;
    public mmsOrgs: OrgObject[];

    //injectables
    public subs: Rx.IDisposable[];

    //local
    public isNavCollapsed: boolean;
    public about: string;
    public searchClass: string;
    public username: string;
    public user: UserObject;
    public userBadge: string;

    protected showSearch: boolean = true;
    private project: ProjectObject;
    private org: OrgObject;
    private ref: RefObject;
    private projects: ProjectObject[];
    private orgs: OrgObject[];

    constructor(
        private $uiRouter: UIRouter,
        private $state: StateService,
        private $location: angular.ILocationService,
        private $uibModal: VeModalService,
        private $window: angular.IWindowService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growl: angular.growl.IGrowlService,
        private authSvc: AuthService,
        private userSvc: UserService,
        private eventSvc: EventService,
        private rootScopeSvc: RootScopeService
    ) {
        this.isNavCollapsed = true;

        this.searchClass = '';
    }

    $onInit(): void {
        this.eventSvc.$init(this);

        this.project = this.mmsProject;
        this.ref = this.mmsRef;
        this.org = this.mmsOrg;

        this.showSearch = !this.$state.includes('**.search.**');

        void this.authSvc.checkLogin().then(
            (data) => {
                this.username = data.username;
                this.userSvc.getUserData(data.username).then(
                    (userData) => {
                        this.user = userData;
                        if (this.user.firstName) {
                            this.userBadge = this.user.firstName.substring(0, 1).toUpperCase();
                            this.userBadge += this.user.lastName.substring(0, 1).toUpperCase();
                        } else {
                            this.userBadge = this.user.username
                                ? this.user.username.substring(0, 2).toUpperCase()
                                : 'VE';
                        }
                    },
                    () => {
                        this.userBadge = this.username.substring(0, 1).toUpperCase();
                    }
                );
            },
            () => {
                this.eventSvc.$broadcast('mms.unauthorized');
            }
        );
    }

    updateOrg(): void {
        const settings: VeModalSettings<SelectModalResolveFn> = {
            component: 'selectModal',
            windowClass: 've-dropdown-short-modal',
            resolve: {
                mmsOrgs: () => {
                    return this.mmsOrgs;
                },
                mmsOrg: () => {
                    return this.org;
                },
                mmsProjects: () => {
                    return this.mmsProjects;
                },
                mmsProject: () => {
                    return this.project;
                },
            },
        };
        this.$uibModal.open<SelectModalResolveFn, void>(settings);
    }

    toggleHelp(): void {
        this.hotkeys.toggleCheatSheet();
    }

    toggleAbout(): void {
        this.$uibModal.open({
            component: 'aboutModal',
        });
    }

    logout(): void {
        this.authSvc.logout().then(
            () => {
                void this.$state.go('main.login');
            },
            () => {
                this.growl.error('You were not logged out');
            }
        );
    }

    search(searchText: string): void {
        if (this.$state.includes('main.project.ref.view.reorder')) {
            this.growl.warning('Please finish reorder action first.');
            return;
            // } else if ($state.includes('main.project.diff')) {
            //     growl.warning("Please finish diff action first.");
            //     return;
        } else {
            this.searchClass = 'fa fa-spin fa-spinner';
            void this.$state.go('main.project.ref.search', {
                keywords: searchText,
                field: 'name',
            });
        }
    }
}

const NavBarComponent: VeComponentOptions = {
    selector: 'navBar',
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
            <a ng-if="!$ctrl.org.homeLink" class="org-title" ui-sref="'main.project.ref.portal({projectId: $ctrl.project.id, refId: $ctrl.mmsRef.id})">{{ $ctrl.org.name }}</a>
            <a ng-if="$ctrl.org.homeLink" class="org-title" ng-href="{{$ctrl.org.homeLink}}">{{ $ctrl.org.name }}</a>
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
                                <a href="https://github.com/Open-MBEE/ve/issues" target="_blank">Report Issue</a>
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
    controller: NavBarController,
};

veApp.component(NavBarComponent.selector, NavBarComponent);
