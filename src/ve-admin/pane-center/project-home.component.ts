import { IPane } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin/ve-admin.module';
import { RootScopeService } from '@ve-utils/application';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, ProjectObject, RefObject, UserObject } from '@ve-types/mms';

class ProjectHomeController implements angular.IComponentController {
    mmsProject: ProjectObject;
    mmsOrg: OrgObject;
    currentUser: UserObject;
    mmsRef: RefObject;

    //Ng-Pane
    $pane: IPane;

    //Locals
    orgId: string;
    projectId: string;
    project: ProjectObject;
    admin = false;
    permissions: any;
    error: string | null = null;
    refId: string;

    static $inject = ['RootScopeService'];

    constructor(private rootScopeSvc: RootScopeService) {}

    $onInit(): void {
        this.rootScopeSvc.veHideLeft(true);
        this.rootScopeSvc.veHideRight(false);
        this.orgId = this.mmsOrg.id;
        this.projectId = this.mmsProject.id;
        this.project = this.mmsProject;
        this.refId = this.mmsRef ? this.mmsRef.id : 'master';
        this.refresh();
    }

    refresh = (): void => {
        //Do nothing
    };

    handleRouteChange = (): void => {
        //Do Nothing
    };
}

const ProjectHome: VeComponentOptions = {
    selector: 'projectHome',
    require: {
        $pane: '^ngPane',
    },
    bindings: {
        mmsOrg: '<',
        currentUser: '<',
    },
    template: `
      <div id="workspace">
        <div class="workspace-header header-box-depth">
           <h2 class="workspace-title workspace-title-padding">Projects</h2>
           <div ng-if="$ctrl.write || $ctrl.admin">
            <button class="btn btn-outline-secondary" ng-click="$ctrl.handleToggle()">
           </div>
        </div>
        <div id="workspace-body" class="extra-padding">
          <list class-name="main-workspace">
            <list-item ng-repeat="project in $ctrl.orgs.projects" key="project-key-{{project.id}}" class-name="proj-org-header">{{project.name}}</list-item>
          </list>
      </div>
    `,
    controller: ProjectHomeController,
};

veAdmin.component(ProjectHome.selector, ProjectHome);
