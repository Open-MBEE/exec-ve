import { StateService } from '@uirouter/angularjs';

import { OrgService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

import veConfig from '@ve-types/config';
import { OrgObject, ProjectObject } from '@ve-types/mms';
import {
    VeModalComponent,
    VeModalResolve,
    VeModalController,
    VeModalInstanceService,
    VeModalResolveFn,
} from '@ve-types/view-editor';

interface SelectModalResolve extends VeModalResolve {
    mmsOrgs: OrgObject[];
    mmsOrg: OrgObject;
    mmsProjects: ProjectObject[];
    mmsProject: ProjectObject;
}

export interface SelectModalResolveFn extends VeModalResolveFn {
    mmsOrgs(): OrgObject[];
    mmsOrg(): OrgObject;
    mmsProjects(): ProjectObject[];
    mmsProject(): ProjectObject;
}

class SelectModalController implements VeModalController {
    static $inject = ['$state', 'OrgService'];

    //bindings
    public modalInstance: VeModalInstanceService<void>;
    private resolve: SelectModalResolve;

    //local
    public spin = false;
    public project: ProjectObject;
    public org: OrgObject;
    public orgs: OrgObject[];
    protected orgSpin: boolean;
    protected projSpin: boolean;

    constructor(private $state: StateService, private orgSvc: OrgService) {}

    $onInit(): void {
        this.orgs =
            veConfig.profiles && veConfig.profiles.hideOrg
                ? this.resolve.mmsOrgs.filter((org) => {
                      return org.id == veConfig.profiles.orgId;
                  })
                : this.resolve.mmsOrgs;

        this.org = this.resolve.mmsOrg;
        this.project = this.resolve.mmsProject;
    }

    public selectOrg = (org: OrgObject): void => {
        if (org) {
            this.org = org;
            this.project = null;
        }
    };

    public selectProject = (project: ProjectObject): void => {
        if (project) {
            this.project = project;
        }
    };

    public continue = (): void => {
        if (this.org && this.project) {
            // was the same project selected? cancel...
            if (this.resolve.mmsProject.orgId === this.org.id && this.resolve.mmsProject.id === this.project.id) {
                this.cancel();
            } else {
                this.spin = true;
                this.$state
                    .go('main.project.ref.portal', {
                        orgId: this.org.id,
                        projectId: this.project.id,
                        refId: 'master',
                        keywords: undefined,
                    })
                    .finally(() => {
                        this.spin = false;
                        this.modalInstance.close();
                    });
            }
        }
    };

    public refreshOrgs = (): void => {
        this.org = null;
        this.project = null;
        this.orgSpin = true;
        this.orgs.length = 0;
        this.orgSvc
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
        this.project = null;
        this.orgSvc
            .getOrg(this.org.id, true)
            .then((data) => {
                this.org = data;
                this.orgs = this.orgs.filter((org) => {
                    org.id = this.org.id;
                });
                this.orgs.push(data);
                if (
                    data &&
                    data.projects.length > 0 &&
                    data.projects.filter((p) => {
                        return p.id === this.project.id;
                    }).length === 0
                ) {
                    this.selectProject(data.projects[0]);
                } else {
                    //no projects
                }
            })
            .finally(() => {
                this.projSpin = false;
            });
    };

    public cancel = (): void => {
        this.modalInstance.dismiss();
    };
}

const SelectModalComponent: VeModalComponent = {
    selector: 'selectModal',
    template: `
    <div id="modal-window" class="ve-dark-modal">
    <div class="modal-header">
        <h4 class="modal-title">Switch Org</h4>
    </div>
    <div class="modal-body ve-dark-dropdown-wide" id="modal-body">
        <div class="ve-dark-dropdown-wide">
            <span class="label-dropdown">Org:</span>
            <div class="input-group select-toolbar" role="toolbar">
                <div class="input-group-prepend ve-dark-dropdown-wide" role="group" uib-dropdown keyboard-nav>
                    <button id="org-btn-keyboard-nav" type="button" class="dropdown-toggle" uib-dropdown-toggle>
                        <span ng-hide="$ctrl.org">No selected Org</span>
                        <span>{{ $ctrl.org.name }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                    </button>
                    <div class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                        aria-labelledby="org-btn-keyboard-nav">
                        <a ng-repeat="org in $ctrl.orgs | orderBy: 'name'" ng-click="$ctrl.selectOrg(org)"
                            ng-class="{'checked-list-item': org.name === $ctrl.org.name, 'dropdown-item': true}">{{ org.name }}
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
                        ng-disabled="!$ctrl.org || !$ctrl.org.projects.length">
                    <span ng-hide="$ctrl.org && $ctrl.org.projects.length">No Projects for selected Org</span>
                    <span ng-hide="!$ctrl.org || $ctrl.project">No selected Project</span>
                    <span ng-show="$ctrl.org && $ctrl.org.projects.length">{{ $ctrl.project.name }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
                </button>
                <div class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                        aria-labelledby="proj-btn-keyboard-nav">
                        <a ng-repeat="project in $ctrl.projects | orderBy: 'name'" ng-click="$ctrl.selectProject(project)">
                            <span ng-class="{'checked-list-item': project.name === $ctrl.selectedProject}">{{ project.name }}</span>
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
    </div>
    <div class="modal-footer ng-scope">
        <button class="btn btn-primary" type="button" ng-click="$ctrl.continue()" ng-disabled="!$ctrl.project || !$ctrl.org">
            Continue<span ng-if="$ctrl.spin"><i class="fa fa-spin fa-spinner"></i></span>
        </button>
        <button class="btn btn-secondary" type="button" ng-click="$ctrl.cancel()">Cancel</button>
    </div>
</div>
`,
    bindings: {
        modalInstance: '<',
        resolve: '<',
    },
    controller: SelectModalController,
};

veApp.component(SelectModalComponent.selector, SelectModalComponent);
