import { IPane } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin';
import { RootScopeService } from '@ve-utils/application';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, UserObject } from '@ve-types/mms';

class OrganizationSidebarController implements angular.IComponentController {
    mmsOrg: OrgObject;
    currentUser: UserObject;

    //Ng-Pane
    $pane: IPane;

    //Locals
    org: OrgObject;
    orgId: string;
    admin = false;
    permissions: any;
    error: string | null = null;

    static $inject = ['RootScopeService'];

    constructor(private rootScopeSvc: RootScopeService) {}

    $onInit(): void {
        this.rootScopeSvc.veHideLeft(true);
        this.rootScopeSvc.veHideRight(false);
        this.org = this.mmsOrg;
        this.orgId = this.mmsOrg.id;
        this.refresh();
    }

    refresh = (): void => {
        //Do nothing
    };

    handleRouteChange = (): void => {
        //Do Nothing
    };
}

const OrganizationSidebarComponent: VeComponentOptions = {
    selector: 'organizationSidebar',
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
        <sidebar title="{{$ctrl.org.name}}">
          <sidebar-link id="Home"
                        title="Home"
                        icon="fas fa-home"
                        router-link="main.admin.org.home({orgId: '{{$ctrl.orgId}}' })"></sidebar-link>
          <sidebar-link id="Projects"
                        title="Projects"
                        icon="fas fa-boxes"
                        router-link="main.admin.org.projects({orgId: '{{$ctrl.orgId}}' })"></sidebar-link>
          <sidebar-link id="Members"
                        title="Members"
                        icon="fas fa-users"
                        router-link="main.admin.org.users({orgId: '{{$ctrl.orgId}}' })"></sidebar-link>
        </sidebar>
        <div id="view" ng-if="!$ctrl.org" class="loading">{{$ctrl.error || 'Loading your project...'}}</div>
        <div ng-if="$ctrl.org">
        </div>
      </div>
    `,
    controller: OrganizationSidebarController,
};

veAdmin.component(OrganizationSidebarComponent.selector, OrganizationSidebarComponent);
