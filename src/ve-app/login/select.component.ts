import { StateService, TransitionService, UIRouter, UIRouterGlobals } from '@uirouter/angularjs';
import { IComponentController } from 'angular';
import Rx from 'rx-lite';

import { BrandingStyle, RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { ProjectService, AuthService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, ParamsObject, ProjectObject } from '@ve-types/mms';
import { VeStorageService } from '@ve-types/view-editor';

class SelectController implements IComponentController {
    static $inject = [
        '$uiRouter',
        '$transitions',
        '$state',
        '$localStorage',
        'growl',
        'ProjectService',
        'AuthService',
        'RootScopeService',
        'EventService',
    ];

    //injectables
    private $uiRouterGlobals: UIRouterGlobals = this.$uiRouter.globals;
    public subs: Rx.IDisposable[];

    //Bindings
    public mmsOrgs: OrgObject[];
    mmsLoginBanner: BrandingStyle;
    mmsProjects: ProjectObject[];

    //local
    public redirect_from_old: boolean;
    pageTitle: string;
    fromLogin: boolean;
    spin: boolean = false;
    logout_spin: boolean = false;
    orgs: OrgObject[];
    projects: ProjectObject[];
    orgId: string;
    projectId: string;
    selectedOrg: string;
    selectedProject: string;
    loginBanner: BrandingStyle;
    protected orgSpin: boolean;
    protected projSpin: boolean;
    protected bannerSpin: boolean;

    constructor(
        private $uiRouter: UIRouter,
        private $transitions: TransitionService,
        private $state: StateService,
        private $localStorage: VeStorageService,
        private growl: angular.growl.IGrowlService,
        private projectSvc: ProjectService,
        private authSvc: AuthService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.rootScopeSvc.veShowLogin(true);
        if (!this.mmsLoginBanner) {
            this.mmsLoginBanner = {
                labels: ['Select Desired Org/Project Above'],
                disabled: false,
            };
        }
        this.loginBanner = this.mmsLoginBanner;

        this.eventSvc.$init(this);
        this.rootScopeSvc.veTitle('View Editor'); //what to name this?
        this.redirect_from_old = this.rootScopeSvc.veRedirectFromOld();

        this.subs.push(
            this.eventSvc.binding(this.rootScopeSvc.constants.VEREDIRECTFROMOLD, (data: boolean) => {
                this.redirect_from_old = data;
            })
        );
        this.rootScopeSvc.veTitle('Projects');
        this.pageTitle = 'View Editor';
        this.fromLogin = (this.$uiRouterGlobals.params as ParamsObject).fromLogin;
        this.$localStorage.$default({ org: this.mmsOrgs[0] });
        this.orgs = this.mmsOrgs;
        if (this.$localStorage.org) {
            this.selectOrg(this.$localStorage.org);
        }
    }

    public selectOrg = (org: OrgObject): void => {
        if (org) {
            this.$localStorage.org = org;
            this.orgId = org.id;
            this.$localStorage.org.orgName = org.name;
            this.selectedOrg = this.$localStorage.org.name;
            this.selectedProject = '$resolve.Ob'; // default here?
            this.projectSvc.getProjects(this.orgId).then(
                (data) => {
                    this.projects = data;
                    if (data && data.length > 0) {
                        if (this.$localStorage.project && this.checkForProject(data, this.$localStorage.project)) {
                            this.selectedProject = this.$localStorage.project.name;
                            this.projectId = this.$localStorage.project.id;
                        } else {
                            this.selectProject(data[0]);
                        }
                    }
                },
                (reason) => {
                    this.growl.error('Error getting project data: ' + reason.message);
                }
            );
        }
    };

    public selectProject = (project: ProjectObject): void => {
        if (project) {
            this.$localStorage.project = project;
            this.selectedProject = this.$localStorage.project.name;
            this.projectId = this.$localStorage.project.id;
        }
    };

    public refreshOrgs = (): void => {
        this.orgSpin = true;
        this.orgs.length = 0;
        this.projectSvc
            .getOrgs(true)
            .then((data) => {
                this.orgs.push(...data);
            })
            .finally(() => {
                this.orgSpin = false;
            });
    };

    public refreshProjects = (): void => {
        this.projSpin = true;
        this.projects.length = 0;
        this.projectSvc
            .getProjects(this.orgId, true)
            .then((data) => {
                this.projects.push(...data);
                if (
                    data &&
                    data.length > 0 &&
                    this.projects.filter((p) => {
                        return p.id === this.projectId;
                    }).length === 0
                ) {
                    this.selectProject(data[0]);
                } else {
                    //no projects
                }
            })
            .finally(() => {
                this.projSpin = false;
            });
    };

    public checkForProject(projectArray: ProjectObject[], project: ProjectObject): boolean {
        for (let i = 0; i < projectArray.length; i++) {
            if (projectArray[i].id === project.id) {
                return true;
            }
        }
        return false;
    }

    public continue = (): void => {
        if (this.orgId && this.projectId) {
            this.spin = true;
            this.rootScopeSvc.veRedirectFromOld(false);
            void this.$state
                .go('main.project.ref.portal', {
                    orgId: this.orgId,
                    projectId: this.projectId,
                    refId: 'master',
                })
                .finally(() => (this.spin = false));
        }
    };
    public logout = (): void => {
        this.logout_spin = true;
        this.authSvc
            .logout()
            .then(
                () => {
                    void this.$state.go('main.login', {});
                },
                () => {
                    this.growl.error('You were not logged out');
                }
            )
            .finally(() => {
                this.logout_spin = false;
            });
    };
}

const SelectComponent: VeComponentOptions = {
    selector: 'projectSelect',
    template: `
    <div id="ve-origin-select" class="row">
    <div class="account-wall">
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
                <div class="ve-dark-dropdown-wide">
                    <span class="label-dropdown">Org:</span>
                    <div class="btn-toolbar select-toolbar" role="toolbar">
                        <div class="btn-group ve-dark-dropdown-wide" role="group" uib-dropdown keyboard-nav>
                            <button id="org-btn-keyboard-nav" type="button" class="dropdown-toggle" uib-dropdown-toggle>
                                <span>{{ $ctrl.selectedOrg }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                            </button>
                            <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                                aria-labelledby="org-btn-keyboard-nav">
                                <li ng-repeat="org in $ctrl.orgs | orderBy: 'name'" ng-click="$ctrl.selectOrg(org)"
                                    ng-class="{'checked-list-item': org.name === $ctrl.selectedOrg}">{{ org.name }}
                                </li>
                            </ul>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-info" uib-tooltip="Refresh Orgs" ng-click="$ctrl.refreshOrgs()">
                                <i ng-show="!$ctrl.orgSpin" class="fa fa-refresh"></i>
                                <i ng-show="$ctrl.orgSpin" class="fa fa-spin fa-refresh"></i>
                            </button>
                        </div>      
                    </div>
                    <span class="label-dropdown">Project:</span>
                    <div class="btn-toolbar select-toolbar" role="toolbar">
                        <div class="btn-group ve-dark-dropdown-wide" role="group" uib-dropdown keyboard-nav>
                            <button id="proj-btn-keyboard-nav" type="button" class="dropdown-toggle" uib-dropdown-toggle
                                    ng-disabled="!$ctrl.selectedOrg || !$ctrl.projects.length">
                                <span ng-hide="$ctrl.projects.length">No Projects for selected Org</span>
                                <span ng-show="$ctrl.projects.length">{{ $ctrl.selectedProject }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                            </button>
                            <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                                aria-labelledby="proj-btn-keyboard-nav">
                                <li ng-repeat="project in $ctrl.projects | orderBy: 'name'" ng-click="$ctrl.selectProject(project)"
                                    ng-class="{'checked-list-item': project.name === $ctrl.selectedProject}">{{ project.name }}
                                </li>
                            </ul>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-info" uib-tooltip="Refresh Projects" ng-click="$ctrl.refreshProjects()">
                                <i ng-show="!$ctrl.projSpin" class="fa fa-refresh"></i>
                                <i ng-show="$ctrl.projSpin" class="fa fa-spin fa-refresh"></i>
                            </button>
                        </div>  
                    </div>
                </div>
                <button class="btn btn-block btn-primary" type="submit" ng-disabled="!$ctrl.selectedProject || !$ctrl.selectedOrg" ng-click="$ctrl.continue()">Continue
                    <span ng-if="$ctrl.spin"><i class="fa fa-spin fa-spinner"></i></span>
                </button>
            </form>
        </div>   
        <br/>
        <login-banner mms-login-banner="$ctrl.loginBanner"></login-banner>
    </div>
</div>
`,
    bindings: {
        mmsOrgs: '<',
        mmsLoginBanner: '<',
    },
    controller: SelectController,
};

veApp.component(SelectComponent.selector, SelectComponent);
