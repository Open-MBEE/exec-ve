import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, PermissionMap, ProjectObject, UserObject } from '@ve-types/mms';
import Role from '@ve-types/mms/permissions';

class MembersPageController implements angular.IComponentController {
    org?: OrgObject;
    project?: ProjectObject;

    //local
    admin: boolean;
    modal: boolean;
    selectedUser: UserObject | string;
    title: string;
    userperm: PermissionMap;
    users: string[];
    roles = Role;

    userTemplate = {
        firstName: 'Name',
        lastName: 'Last Name',
        username: 'Username',
    };

    // Define toggle function
    handleToggle(username: string): void {
        // Verify username provided
        this.selectedUser = username;
    }

    $onInit(): void {
        if (this.org) {
            this.userperm = this.org.permission;
            this.users = Object.keys(this.org.permission.users);
            this.title = this.org.name;
        } else {
            this.userperm = this.project.permission;
            this.users = Object.keys(this.project.permission.users);
            this.title = this.project.name;
        }
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
            <div class="roles-box">
              <member-edit ng-show="$ctrl.project && !$ctrl.org" project="$ctrl.project"
                selected-user="$ctrl.selectedUser"
                admin="$ctrl.admin"/>
              <member-edit ng-hide="$ctrl.project && !$ctrl.org" org="$ctrl.org"
                selected-user="$ctrl.selectedUser"
                admin="$ctrl.admin"/>
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
                                _key="key-{{user}}"></user-list-item>
                  <span uib-tooltip="Edit" tooltip-placement="top">
                      <i ng-click="$ctrl.handleEditToggle(user)" class="fas fa-user-edit add-btn"></i>
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
    },
};

veAdmin.component(MembersPageComponent.selector, MembersPageComponent);
