import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject } from '@ve-types/mms';

class ProjectListController implements angular.IComponentController {
    //Bindings
    orgs: OrgObject[];

    //Pane
    $pane: IPane;
    resizer: Rx.Disposable;

    width: number;
    projectsAvaliable: boolean;

    $onInit(): void {
        this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.handleResize();
        for (const org of this.orgs) {
            if (org.projects.length > 0) {
                this.projectsAvaliable = true;
                break;
            }
        }
    }

    $onDestroy(): void {
        this.resizer.dispose();
    }

    handleResize = (): void => {
        if (this.$pane.$region) {
            this.width = this.$pane.$region.width;
        }
    };

    handleDeleteToggle(): void {
        //TBD
    }

    handleCreateToggle(): void {
        //TBD
    }
}

const ProjectListComponent: VeComponentOptions = {
    selector: 'projectList',
    controller: ProjectListController,
    bindings: {
        orgs: '<mmsOrgs',
    },
    require: {
        $pane: '^ngPane',
    },
    template: `
    <div id="workspace" ref={ref}>
    <div class="workspace-header header-box-depth">
        <h2 class="workspace-title">
            Projects
        </h2>
        <div class="workspace-header-button">
            <button class="btn btn-outline-primary"
                    ng-click="$ctrl.handleCreateToggle()">
                <i class="fas fa-plus add-btn"></i>
                <span ng-if="$ctrl.width > 600">Create</span>
            </button>
            <button class="btn btn-outline-danger"
                      ng-click="$ctrl.handleDeleteToggle()">
                <i class="fas fa-trash-alt delete-btn"></i>
                <span ng-if="$ctrl.width > 600">Delete</span>
            </button>
        </div>
    </div>
    <div id="workspace-body" class="extra-padding">
            <div ng-if="!$ctrl.projectsAvaliable" class="main-workspace list-item">
                <h3> No projects. </h3>
            </div>
            <list class-name="main-workspace" ng-if="$ctrl.projectsAvaliable">
                <list-item ng-repeat="org in $ctrl.orgs" key="org-key-{{ org.id}}">
                    <list-item class-name="proj-org-header">
                        <a ng-class="{'archive-link': org.archived }" ui-sref="main.admin.org({ orgId: '{{ org.id }}' })">{{ org.name }}</a>
                    </list-item>
                    <list key="org-list-key-{{ org.id }}">
                        <project-list-item ng-repeat="project in org.projects"
                                class-name="hover-darken project-hover"
                                project="project"
                                link="main.admin.project({ projectId: '{{ project.id }}' })"
                                archive-proj="org.archived">
                        </project-list-item>
                    </list>
                </list-item>
            </list>
        </div>
    </div>
</div>
`,
};

veAdmin.component(ProjectListComponent.selector, ProjectListComponent);
