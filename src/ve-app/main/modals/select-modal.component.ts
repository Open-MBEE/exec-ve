import { StateService } from '@uirouter/angularjs';
import angular from 'angular';

import { ProjectService } from '@ve-utils/mms-api-client';

import { veApp } from '@ve-app';

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
    static $inject = ['$scope', '$state', 'ProjectService'];

    //bindings
    public modalInstance: VeModalInstanceService<void>;
    private resolve: SelectModalResolve;

    //local
    public spin = false;
    public orgId: string;
    public projectId: string = '';
    public selectedOrg: string;
    public selectedProject: string;
    public orgs: OrgObject[];
    public projects: ProjectObject[];
    protected orgSpin: boolean;
    protected projSpin: boolean;

    constructor(private $scope: angular.IScope, private $state: StateService, private projectSvc: ProjectService) {}

    $onInit(): void {
        this.orgs = this.resolve.mmsOrgs;
        this.projects = this.resolve.mmsProjects;

        this.orgId = this.resolve.mmsOrg.id;
        this.projectId = this.resolve.mmsProject.id;

        this.selectedOrg = this.resolve.mmsOrg.name;
        this.selectedProject = this.resolve.mmsProject.name;
    }

    public selectOrg = (org: OrgObject): void => {
        if (org) {
            this.orgId = org.id;
            this.selectedOrg = org.name;
            this.selectedProject = '';
            this.projSpin = true;
            this.refreshProjects();
        }
    };

    public selectProject = (project: ProjectObject): void => {
        if (project) {
            this.projectId = project.id;
            this.selectedProject = project.name;
        }
    };

    public continue = (): void => {
        if (this.orgId && this.projectId) {
            // was the same project selected? cancel...
            if (this.resolve.mmsProject.orgId === this.orgId && this.resolve.mmsProject.id === this.projectId) {
                this.cancel();
            } else {
                this.spin = true;
                this.$state
                    .go('main.project.ref.portal', {
                        orgId: this.orgId,
                        projectId: this.projectId,
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
    <div class="modal-footer ng-scope">
        <button class="btn btn-primary" type="button" ng-click="$ctrl.continue()" ng-disabled="!$ctrl.selectedProject || !$ctrl.selectedOrg">
            Continue<span ng-if="$ctrl.spin"><i class="fa fa-spin fa-spinner"></i></span>
        </button>
        <button class="btn btn-default" type="button" ng-click="$ctrl.cancel()">Cancel</button>
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
