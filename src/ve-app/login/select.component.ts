import { StateService, TransitionService, UIRouter, UIRouterGlobals } from '@uirouter/angularjs';
import { IComponentController } from 'angular';
import Rx from 'rx-lite';

import { BrandingStyle, RootScopeService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { ProjectService, AuthService, OrgService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import { VeComponentOptions } from '@ve-types/angular';
import veConfig from '@ve-types/config';
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
        'OrgService',
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
    org: OrgObject;
    project: ProjectObject;
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
        private orgSvc: OrgService,
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
        this.orgs =
            veConfig.profiles && veConfig.profiles.hideOrg
                ? this.mmsOrgs.filter((org) => {
                      return org.id == veConfig.profiles.orgId;
                  })
                : this.mmsOrgs;
        this.$localStorage.$default({ org: this.mmsOrgs[0] });

        if (this.$localStorage.org) {
            this.selectOrg(this.$localStorage.org);
        }
    }

    public selectOrg = (org: OrgObject): void => {
        if (org) {
            this.org = org;
            if (this.org.projects &&this.org.projects.length > 0) {
                this.project = this.org.projects[0];
            } else {
                this.project = null;
            }
        }
    };

    public selectProject = (project: ProjectObject): void => {
        if (project) {
            this.project = project;
        }
    };

    public continue = (): void => {
        if (this.org && this.project) {
            this.spin = true;
            this.rootScopeSvc.veRedirectFromOld(false);
            void this.$state
                .go('main.project.ref.portal', {
                    orgId: this.org.id,
                    projectId: this.project.id,
                    refId: 'master',
                })
                .finally(() => (this.spin = false));
        }
    };

    public refreshOrgs = (): void => {
        this.orgSpin = true;
        const projId = this.project ? this.project.id : null;
        this.project = null;
        const orgId = this.org ? this.org.id : null;
        this.org = null;
        this.orgs.length = 0;
        this.orgSvc
            .getOrgs(true)
            .then((data) => {
                this.orgs.push(...data);
                if (this.orgs.length > 0) {
                    for (const org of this.orgs) {
                        if (org.id == orgId) {
                            this.org = org;
                        }
                    }
                    if (!this.org) {
                        this.selectOrg(this.orgs[0]);
                    }
                }
            })
            .finally(() => {
                this.orgSpin = false;
            });
    };

    public refreshProjects = (): void => {
        this.projSpin = true;
        const id = this.project ? this.project.id : null;
        this.project = null;
        this.orgSvc
            .getOrg(this.org.id, true)
            .then((data) => {
                this.org = data;
                this.orgs = this.orgs.filter((org) => {
                    org.id != this.org.id;
                });
                this.orgs.push(data);
                if (data && data.projects.length > 0) {
                    for (const project of data.projects) {
                        if (project.id == id) {
                            this.selectProject(project);
                            break;
                        }
                    }
                    if (!this.project) {
                        this.selectProject(data.projects[0]);
                    }
                }
            })
            .finally(() => {
                this.projSpin = false;
            });
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
        <div ng-class="{'animated-fade-in-slide': $ctrl.fromLogin}">
            <div>
                <a class="select-logout-button" ng-click="$ctrl.logout()" uib-tooltip="Return to Login">
                        <span ng-if="$ctrl.logout_spin"><i class="fa fa-spin fa-spinner"></i></span>
                        <span ng-if="!$ctrl.logout_spin"><i class="fa fa-arrow-left" aria-hidden="true"></i></span>
                </a>
            </div>
            <div>
                <img src="img/logo-large.svg" alt="Program Logo">
            </div>
            <div class="ve-dark-dropdown-wide">
                <span class="label-dropdown">Org:</span>
                <div class="input-group select-toolbar" role="toolbar">
                    <div class="input-group-prepend ve-dark-dropdown-wide" role="group" uib-dropdown keyboard-nav>
                        <button id="org-btn-keyboard-nav" type="button" class="dropdown-toggle" uib-dropdown-toggle>
                            <span>{{ $ctrl.org.name }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                        </button>
                        <div class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                                aria-labelledby="org-btn-keyboard-nav">
                            <a ng-repeat="org in $ctrl.orgs | orderBy: 'name'" ng-click="$ctrl.selectOrg(org)" class="dropdown-item"
                                    ng-class="{'checked-list-item': org.name === $ctrl.org.name}">{{ org.name }}
                            </a>
                        </div>
                    </div>
                    <div class="input-group-append" role="group">
                        <button class="btn btn-info" uib-tooltip="Refresh Orgs" ng-click="$ctrl.refreshOrgs()">
                            <i ng-show="!$ctrl.orgSpin" class="fa fa-refresh"></i>
                            <i ng-show="$ctrl.orgSpin" class="fa fa-spin fa-refresh"></i>
                        </button>
                    </div>      
                </div>
            </div>
            <div class="ve-dark-dropdown-wide">
                <span class="label-dropdown">Project:</span>
                <div class="input-group select-toolbar" role="toolbar">
                    <div class="input-group-prepend ve-dark-dropdown-wide" role="group" uib-dropdown keyboard-nav>
                        <button id="proj-btn-keyboard-nav" type="button" class="dropdown-toggle" uib-dropdown-toggle
                                ng-disabled="!$ctrl.org.name || !$ctrl.org.projects.length">
                            <span ng-show="$ctrl.org && !$ctrl.org.projects.length">No Projects for selected Org</span>
                            <span ng-show="$ctrl.org && $ctrl.org.projects.length && !$ctrl.project">No selected Project<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                            <span ng-show="$ctrl.org && $ctrl.org.projects.length && $ctrl.project">{{ $ctrl.project.name }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                        </button>
                        <div class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                                aria-labelledby="proj-btn-keyboard-nav">
                            <a ng-class="{'checked-list-item': project.name === $ctrl.project.name}" 
                                    ng-repeat="project in $ctrl.org.projects | orderBy: 'name'" 
                                    ng-click="$ctrl.selectProject(project)"
                                    class="dropdown-item">
                                {{ project.name }}
                            </a>
                        </div>
                    </div>
                    <div class="input-group-append" role="group">
                        <button class="btn btn-info" uib-tooltip="Refresh Projects" ng-click="$ctrl.refreshProjects()">
                            <i ng-show="!$ctrl.projSpin" class="fa fa-refresh"></i>
                            <i ng-show="$ctrl.projSpin" class="fa fa-spin fa-refresh"></i>
                        </button>
                    </div>  
                </div>
            </div>
            <button class="btn btn-block btn-primary" type="submit" ng-disabled="!$ctrl.project || !$ctrl.org" ng-click="$ctrl.continue()">Continue
                <span ng-if="$ctrl.spin"><i class="fa fa-spin fa-spinner"></i></span>
            </button>
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
