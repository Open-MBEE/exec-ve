import { veAdmin } from '@ve-admin';

import { ListApi } from './list.component';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, ProjectObject, UserObject } from '@ve-types/mms';
import Role from '@ve-types/mms/permissions';
import { VeModalService } from '@ve-types/view-editor';

class OrgListController {
    //bindings
    private org: OrgObject;
    private admin: boolean;
    private write: boolean;
    private user: UserObject;
    public showProjs: boolean;

    //Parent Controllers
    private listApi: ListApi;

    private projectListApi: ListApi;

    public width: number;
    public modalProjCreate: boolean;
    public modalOrgDelete: boolean;
    public projects: ProjectObject[];
    public create: boolean;
    public delete: boolean;

    static $inject = ['$uibModal'];

    projAdmin: { [projId: string]: boolean } = {};

    constructor(private $uibModal: VeModalService) {
        this.width = null;
        this.modalProjCreate = false;
        this.modalOrgDelete = false;
    }

    $onInit(): void {
        this.projectListApi = {
            onRefresh: this.refresh,
            onExpandChange: this.listApi.onExpandChange,
        };
    }

    // Define org toggle functionality
    handleShowProjsToggle(): void {
        // Set the state to opposite of its initial state
        this.listApi.onExpandChange(this.org.id, !this.showProjs);
    }

    // Define toggle function
    handleDeleteOrgToggle(): void {
        // Set the delete modal state
        this.modalOrgDelete = !this.modalOrgDelete;
        this.org.delete = !this.org.delete;
    }

    // Define toggle function
    handleCreateProjToggle(): void {
        // Set the create modal state
        this.modalProjCreate = !this.modalProjCreate;
        this.create = !this.create;
    }

    refresh = (): void => {
        const { projects } = this.org;
        const permissionedProjs: ProjectObject[] = [];

        // Verify if system admin
        if (!this.admin) {
            const username = this.user.username;
            projects.forEach((project) => {
                const perm = project.permission.users[username].role;

                // Verify if user is project admin
                if (perm === Role.ADMIN) {
                    this.projAdmin[project.id] = true;
                } else {
                    this.projAdmin[project.id] = false;
                }
                // Verify if user can see project
                if (
                    perm === Role.ADMIN ||
                    (!project.archived && (perm === Role.WRITE || perm === Role.READ || project.public))
                ) {
                    permissionedProjs.push(project);
                }
            });
        } else {
            projects.forEach((project) => {
                permissionedProjs.push(project);
            });
        }
        this.projects = permissionedProjs;
    };

    openCreateProjModal(): void {
        // const modalInstance = this.$uibModal.open({
        //     templateUrl: 'app/components/shared-views/create/create.component.html',
        //     controller: 'CreateComponent',
        //     controllerAs: '$ctrl',
        //     resolve: {
        //         project: () => true,
        //         org: () => this.org,
        //     },
        // });
        // modalInstance.result.then(
        //     () => {
        //         this.modalProjCreate = false;
        //         this.org.create = false;
        //         this.refresh();
        //     },
        //     () => {
        //         this.modalProjCreate = false;
        //         this.org.create = false;
        //     }
        // );
    }

    // openDeleteOrgModal() {
    //     const modalInstance = this.modalService.open({
    //         templateUrl: 'app/components/shared-views/delete/delete.component.html',
    //         controller: 'DeleteComponent',
    //         controllerAs: '$ctrl',
    //         resolve: {
    //             org: () => this.org,
    //         },
    //     });

    //     modalInstance.result.then(
    //         () => {
    //             this.modalOrgDelete = false;
    //             this.org.delete = false;
    //             this.refresh();
    //         },
    //         () => {
    //             this.modalOrgDelete = false;
    //             this.org.delete = false;
    //         }
    //     );
    // }
}

const OrgListComponent: VeComponentOptions = {
    selector: 'orgList',
    bindings: {
        org: '<',
        admin: '<',
        write: '<',
        user: '<',
        listApi: '<',
        showProjs: '<',
    },
    template: `
      <div class="org-proj-list">
      <div class="org-icon" ng-click="$ctrl.handleShowProjsToggle()">
        <i class="{{$ctrl.showProjs ? 'fa-solid fa-angle-down' : 'fa-solid fa-angle-right'}}"></i>
      </div>
      <org-list-item class-name="org-info" org="$ctrl.org" divider="true"></org-list-item>
      <div class="controls-container" ng-if="$ctrl.admin || $ctrl.write">
        <i id="newproj-{{ $ctrl.org.id }}" class="fas fa-plus add-btn" data-toggle="tooltip" data-placement="top" title="New Project" ng-click="$ctrl.openCreateProjModal()"></i>
        <i id="delete-{{ $ctrl.org.id }}" class="fas fa-trash-alt transparent" ng-if="!$ctrl.admin || $ctrl.org.id === 'default'" data-toggle="tooltip" data-placement="top" title="Delete"></i>
        <i id="delete-{{ $ctrl.org.id }}" class="fas fa-trash-alt delete-btn" ng-if="$ctrl.admin && $ctrl.org.id !== 'default'" data-toggle="tooltip" data-placement="top" title="Delete" ng-click="$ctrl.openDeleteOrgModal()"></i>
      </div>
    </div>
    
    <div ng-if="$ctrl.showProjs">
      <proj-list ng-repeat="project in $ctrl.org.projects" 
        project="project" 
        admin="$ctrl.admin || $ctrl.projAdmin[project.id]" 
        archive-proj="$ctrl.org.archived" 
        list-api="$ctrl.projectListApi">
      </proj-list>
    </div>
      `,
    controller: OrgListController,
};

veAdmin.component(OrgListComponent.selector, OrgListComponent);
