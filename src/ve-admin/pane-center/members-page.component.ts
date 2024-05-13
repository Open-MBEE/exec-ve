import { veAdmin } from '@ve-admin/ve-admin.module';
import { RootScopeService } from '@ve-utils/application';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, PermissionMap, ProjectObject, UserObject } from '@ve-types/mms';
import Role, { VeRole } from '@ve-types/mms/permissions';

export class MembersPageController implements angular.IComponentController {
    org?: OrgObject;
    project?: ProjectObject;
    user: UserObject;

    //local
    authority: VeRole['ANY'];
    modal: boolean;
    selectedUser: UserObject | string;
    title: string;
    userperm: PermissionMap;
    users: string[];
    roles = Role;

    userTemplate = {
        fullName: 'Name',
        username: 'Username',
        email: 'Email',
        enabled: true,
    };

    static $inject = ['RootScopeService'];

    constructor(private rootScopeSvc: RootScopeService) {}

    // Define toggle function
    handleToggle(username: string): void {
        // Verify username provided
        this.selectedUser = username;
    }

    $onInit(): void {
        this.rootScopeSvc.veHideRight(true);
        if (this.org) {
            this.userperm = this.org.permission;
            this.users = Object.keys(this.org.permission.users);
            this.title = this.org.name;
        } else {
            this.userperm = this.project.permission;
            this.users = Object.keys(this.project.permission.users);
            this.title = this.project.name;
        }
        this.authority = this.userperm.users[this.user.username].role;
    }
}

const MembersPageComponent: VeComponentOptions = {
    selector: 'membersPage',
    template: `
      <div id="workspace">
        <div class="workspace-header header-box-depth">
          <h2 class="workspace-title workspace-title-padding">
            Members of {{ $ctrl.title }}
          </h2>
        </div>
        <div id="workspace-body" class="extra-padding">
          <div class="main-workspace">
            <div class="roles-box" ng-if="$ctrl.roles.ge($ctrl.authority, $ctrl.roles.WRITE)">
              <member-edit project="$ctrl.project" org="$ctrl.org"
                selected-user="$ctrl.selectedUser"
                current-user="$ctrl.user.username"
                authority="$ctrl.authority"/>
            </div>
            <list class="members-box">
                <div class="template-header" key="user-info-template">
                    <user-list-item class-name="head-info"
                                label="true"
                                user="$ctrl.userTemplate"
                                permission="$ctrl.roles.ADMIN"
                                _key="user-template"/>
                </div>
                <div ng-repeat="user in $ctrl.users" class="user-info" key="user-info-{{user}}">
                  <user-list-item class-name="user-name"
                                user="user"
                                permission="$ctrl.userperm.users[user].role"
                                inherited="$ctrl.userperm.users[user].inheritedRole"
                                _key="key-{{user}}"></user-list-item>
                  <span uib-tooltip="Edit" tooltip-placement="top" ng-if="$ctrl.roles.ge($ctrl.authority, $ctrl.roles.WRITE) && !$ctrl.roles.eq($ctrl.userperm.users[user].inheritedRole,$ctrl.roles.ADMIN)">
                      <i ng-click="$ctrl.handleToggle(user)" class="fas fa-user-edit add-btn"></i>
                  </span>
                </div>
            </list>
          </div>
        </div>
      </div>
    `,
    controller: MembersPageController,
    bindings: {
        org: '<mmsOrg',
        project: '<mmsProject',
        user: '<currentUser',
    },
};

veAdmin.component(MembersPageComponent.selector, MembersPageComponent);
