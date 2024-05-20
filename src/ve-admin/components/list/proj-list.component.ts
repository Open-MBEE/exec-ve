import { veAdmin } from '@ve-admin';

import { ListApi } from './list.component';

import { VeComponentOptions } from '@ve-types/angular';
import { ProjectObject } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

class ProjectListController {
    //bindings
    private project: ProjectObject;
    private className: string;

    //Parent Controllers
    private listApi: ListApi;

    public width: number;
    public modalProjCreate: boolean;
    public modalProjectDelete: boolean;
    public create: boolean;
    public delete: boolean;

    static $inject = ['$uibModal'];

    constructor(private $uibModal: VeModalService) {
        this.width = null;
        this.modalProjCreate = false;
        this.modalProjectDelete = false;
    }

    $onInit(): void {
        this.className = `homeproj-list ${this.className}`;
    }

    // Define toggle function
    handleDeleteProjectToggle(): void {
        // Set the delete modal state
        this.modalProjectDelete = !this.modalProjectDelete;
    }

    refresh = (): void => {
        //Do Nothing yet
    };

    openDeleteProjectModal(): void {
        //     const modalInstance = this.modalService.open({
        //         templateUrl: 'app/components/shared-views/delete/delete.component.html',
        //         controller: 'DeleteComponent',
        //         controllerAs: '$ctrl',
        //         resolve: {
        //             project: () => this.project,
        //         },
        //     });
        //     modalInstance.result.then(
        //         () => {
        //             this.modalProjectDelete = false;
        //             this.project.delete = false;
        //             this.refresh();
        //         },
        //         () => {
        //             this.modalProjectDelete = false;
        //             this.project.delete = false;
        //         }
        //     );
    }
}

const ProjectListComponent: VeComponentOptions = {
    selector: 'projList',
    bindings: {
        project: '<',
        admin: '<',
        listApi: '<',
        className: '<',
    },
    template: `
    <div class="proj-list">
      <proj-list-item project="$ctrl.project" divider="true"></project-list-item>
      <div class="controls-container" ng-if="$ctrl.admin">
        <span uib-tooltip="{{$ctrl.title}}" tooltip-placement="top"
        tooltip-append-to-body="true" tooltip-animation="false">
            <i id="delete-{{ $ctrl.project.id }}" class="fas fa-trash-alt delete-btn" ng-if="$ctrl.admin && $ctrl.project.orgId !== 'default'" ng-click="$ctrl.handleDeleteProjectToggle()"></i>
        </span>
      </div>
    </div>
      `,
    controller: ProjectListController,
};

veAdmin.component(ProjectListComponent.selector, ProjectListComponent);
