import { StateService } from '@uirouter/angularjs';

import { SelectModalResolveFn } from '@ve-app/main/modals/select-modal.component';
import { EventService } from '@ve-utils/core';
import { AuthService, UserService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, ProjectObject, RefObject, UserObject } from '@ve-types/mms';
import { VeModalService, VeModalSettings } from '@ve-types/view-editor';

class NavBarController implements angular.IComponentController {
    static $inject = ['$state', '$uibModal', 'hotkeys', 'growl', 'UserService', 'AuthService', 'EventService'];

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
        private $state: StateService,
        private $uibModal: VeModalService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growl: angular.growl.IGrowlService,
        private userSvc: UserService,
        private authSvc: AuthService,
        private eventSvc: EventService
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

        this.username = this.userSvc.getUsername();
        this.userSvc.getCurrentUser().then(
            (userData) => {
                this.user = userData;
                if (this.user.firstName) {
                    this.userBadge = this.user.firstName.substring(0, 1).toUpperCase();
                    this.userBadge += this.user.lastName.substring(0, 1).toUpperCase();
                } else {
                    this.userBadge = this.user.username ? this.user.username.substring(0, 2).toUpperCase() : 'VE';
                }
            },
            () => {
                this.userBadge = this.username.substring(0, 1).toUpperCase();
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

    isAdmin(): boolean {
        return this.user.admin;
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
    <nav class="navbar navbar-inverse navbar-expand navbar-fixed-top" role="navigation">
    <a class="navbar-brand" ui-sref="main.login.select">
        <img src="img/logo.svg" alt="View Editor Logo">
    </a>
    <a ng-if="!$ctrl.orgLink" class="navbar-text org-title" ui-sref="'main.project.ref.portal({projectId: $ctrl.project.id, refId: $ctrl.mmsRef.id})">{{ $ctrl.org.name }}</a>
    <a ng-if="$ctrl.orgLink" class="navbar-text org-title" ng-href="{{$ctrl.orgLink}}">{{ $ctrl.org.name }}</a>
    <a class="switch-org" ng-click="$ctrl.updateOrg()">Switch Org</a>
    <button type="button" class="navbar-toggler" 
            ng-click="$ctrl.isNavCollapsed = !$ctrl.isNavCollapsed"
            aria-controls="global-navigation"
            data-toggle="collapse" 
            data-target="#global-navigation">
        <span class="sr-only">Toggle navigation</span>
        <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" uib-collapse="$ctrl.isNavCollapsed" id="global-navigation">
        <form id="global-search" ng-show="$ctrl.showSearch" ng-submit="$ctrl.search(searchText)" class="form-inline ml-auto" role="search">
                <input placeholder="Search selected project" ng-model="searchText" class="form-control" />
                <button ng-click="$ctrl.search(searchText)">
                    <i class="fa fa-search" aria-hidden="true"></i>
                </button>
        </form>
        <ul class="nav navbar-nav global-menu">
            <li class="nav-item dropdown">
                <span class="dropdown ve-dark-dropdown-nav fixed-content-dropdown" uib-dropdown on-toggle="$ctrl.toggled(open)">
                    <a href id="help-dropdown" class="dropdown-toggle" uib-dropdown-toggle>
                        Help <i class="fa fa-caret-down" aria-hidden="true"></i>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right" uib-dropdown-menu aria-labelledby="help-dropdown">
                        <a class="dropdown-item" href="" ng-click="$ctrl.toggleHelp()">Keyboard Shortcuts</a>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" href="https://docs.openmbee.org/projects/ve" target="_blank">View Editor Help</a>
                        <a class="dropdown-item" href="https://github.com/Open-MBEE/ve/issues" target="_blank">Report Issue</a>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" ng-click="$ctrl.toggleAbout()" href="">About View Editor</a>
                    </div>
                </span>
            </li>
            <li class="nav-item dropdown">
                <span class="dropdown ve-dark-dropdown-nav fixed-content-dropdown user-profile" uib-dropdown on-toggle="$ctrl.toggled(open)">
                    <a href id="login-dropdown" class="dropdown-toggle" uib-dropdown-toggle>
                        <div>{{ $ctrl.userBadge }}</div>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right" uib-dropdown-menu aria-labelledby="login-dropdown" style="white-space: nowrap" role="login-menu">
                        <a class="dropdown-item" ui-sref="main.admin.user({ user: $ctrl.user.username })">User Profile</a>
                        <a class="dropdown-item" ui-sref="main.admin.user.settings({ user: $ctrl.user.username })">User Settings</a>
                        <a class="dropdown-item" ui-sref="main.admin.orgs">Admin</a>
                        <div ng-if="$ctrl.username" class="ve-secondary dropdown-item-text">
                            Logged in as <b ng-if="$ctrl.user.firstName !== undefined">{{ $ctrl.user.firstName }} {{ $ctrl.user.lastName }}</b> ({{ $ctrl.username }})
                        </div>
                        <div class="dropdown-divider"></div>
                        <a class="dropdown-item" ng-click="$ctrl.logout()">Log Out</a>
                    </div>
                </span>
            </li>
        </ul>
    </div>
</nav>
`,
    controller: NavBarController,
};

veApp.component(NavBarComponent.selector, NavBarComponent);
