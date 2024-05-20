import { IPane } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin';
import { RootScopeService } from '@ve-utils/application';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, ProjectObject, RefObject, UserObject } from '@ve-types/mms';

class ProjectSidebarController implements angular.IComponentController {
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

const ProjectSidebarComponent: VeComponentOptions = {
    selector: 'projectSidebar',
    require: {
        $pane: '^ngPane',
    },
    bindings: {
        mmsOrg: '<',
        mmsProject: '<',
        currentUser: '<',
        mmsRef: '<',
    },
    template: `
      <div id="container">
        <sidebar title="{{$ctrl.project.name}}">
          <sidebar-link id="Elements"
                        title="Model"
                        icon="fas fa-sitemap"
                        router-link="main.project.ref.portal({projectId: '{{$ctrl.projectId}}', refId: '{{$ctrl.refId}}' })"></sidebar-link>
          <sidebar-link id="Branches"
                        title="Branches/Tags"
                        icon="fas fa-code-branch"
                        router-link="main.project.ref.refs({projectId: '{{$ctrl.projectId}}', refId: '{{$ctrl.refId}}' })"></sidebar-link>
          <sidebar-link id="Artifacts"
                        title="Artifacts"
                        icon="fas fa-archive"
                        router-link="main.project.ref.artifacts({projectId: '{{$ctrl.projectId}}', refId: '{{$ctrl.refId}}' })"></sidebar-link>
          <sidebar-link id="Search"
                        title="Search"
                        icon="fas fa-search"
                        router-link="main.project.ref.search({projectId: '{{$ctrl.projectId}}', refId: '{{$ctrl.refId}}' })"></sidebar-link>
          <sidebar-link id="Members"
                        title="Members"
                        icon="fas fa-users"
                        router-link="main.admin.project.users({projectId: '{{$ctrl.projectId}}' })"></sidebar-link>
          <sidebar-link id="Information"
                        title="Information"
                        icon="fas fa-info"
                        router-link="main.admin.project({projectId: '{{$ctrl.projectId}}' })"></sidebar-link>
          <div ng-if="$ctrl.project.custom && $ctrl.project.custom.integrations">
            <sidebar-header title="Dashboard"></sidebar-header>
            <sidebar-header title="Integrations"></sidebar-header>
            <sidebar-link ng-repeat="plugin in $ctrl.project.custom.integrations"
                          id="sidebar-{{plugin.name}}"
                          title="{{plugin.title}}"
                          icon="fas fa-{{plugin.icon || 'layer-group'}}"
                          open-new-tab="{{plugin.openNewTab}}"
                          link="{{plugin.url}}"></sidebar-link>
          </div>
        </sidebar>
        <div id="view" ng-if="!$ctrl.project" class="loading">{{$ctrl.error || 'Loading your project...'}}</div>
        <div ng-if="$ctrl.project">
        </div>
      </div>
    `,
    controller: ProjectSidebarController,
};

veAdmin.component(ProjectSidebarComponent.selector, ProjectSidebarComponent);
