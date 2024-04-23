import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';
import { ProjectObject, RefObject } from '@ve-types/mms';

export class ProjectElementsController implements angular.IComponentController {
    //Bindings
    private mmsProject: ProjectObject;
    private mmsRef: RefObject;

    //Locals
    public btnDisClassName: string = 'workspace-title workspace-title-padding';
    public isButtonDisplayed: boolean = false;

    orgId: string;
    projId: string;
    branchId: string;
    constructor() {}

    $onInit(): void {
        this.orgId = this.mmsProject.orgId;
        this.projId = this.mmsProject.id;
        this.branchId = this.mmsRef.id;

        if (this.mmsProject.permissions === 'admin' || this.mmsProject.permissions === 'write') {
            this.isButtonDisplayed = true;
            this.btnDisClassName = 'workspace-title';
        }
    }

    openElementInfo(): void {
        //TBD
    }

    closeSidePanel = (event, refreshIds): void => {};

    editElementInfo = (): void => {};
}

const ProjectElementsComponent: VeComponentOptions = {
    selector: 'projectElements',
    bindings: {
        mmsProject: '<',
        mmsRef: '<',
    },
    controller: ProjectElementsController,
    template: `
    <div className='workspace-header header-box-depth'>
    <h2 className={{$ctrl.btnDisClassName}}>{{$ctrl.mmsProject.name}} Model</h2>
    <div ng-if="$ctrl.isButtonDisplayed" class="workspace-header-button">
        <button class="btn btn-primary" ng-click="$ctrl.createNewElement">Add Element</button>
    </div>
    <div id='workspace-body'>
        <div class='main-workspace'>
            <branch-bar>
            <element-tree>
        </div>
    </div>
</div>
    `,
};

veAdmin.component(ProjectElementsComponent.selector, ProjectElementsComponent);
