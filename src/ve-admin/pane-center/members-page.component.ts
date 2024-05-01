import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, PermissionMap, ProjectObject, UserObject } from '@ve-types/mms';

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

    // Define toggle function
    handleToggle(username: string): void {
        // Verify username provided
        this.selectedUser = username;
    }

    $onInit(): void {
        if (this.org) {
            this.userperm = this.org.permission;
            this.users = Object.keys(this.org.permission);
            this.title = this.org.name;
        } else {
            this.userperm = this.project.permission;
            this.users = Object.keys(this.project.permission);
            this.title = this.project.name;
        }
    }
}

const MembersPageComponent: VeComponentOptions = {
    selector: 'membersPage',
    template: `
      <div id='workspace'>
        <div class='workspace-header header-box-depth'>
          <h2 class='workspace-title workspace-title-padding'>
            Members of {{ $ctrl.title }}
          </h2>
        </div>
        <div id='workspace-body' className='extra-padding'>
          <div className='main-workspace'>
            <div className='roles-box'>
              <member-edit ng-show="$ctrl.project && !$ctrl.org" project="$ctrl.project
                selected-user="$ctrl.selectedUser"
                admin="$ctrl.admin"/>
              <member-edit ng-hide="$ctrl.project && !$ctrl.org" org="$ctrl.org
                selected-user="$ctrl.selectedUser"
                admin="$ctrl.admin"/>
            </div>
            <list className='members-box'>
                <div class='template-header' key='user-info-template'>
                    <user-list-item class-name='head-info'
                                label=true
                                user={{ {
                                firstName: 'Name',
                                lastName: '',
                                username: 'Username',
                                } }}
                                permission='admin'
                                _key='user-template'/>
                </div>
                <div ng-repeat="user in $ctrl.users" class='user-info' key="user-info-{{user}}">
                  <user-list-item class-name='user-name'
                                user="{{user}}"
                                permission="$ctrl.userperm[user].role"
                                _key="key-{{user}}"
                  <div class='controls-container'>
                  <span uib-tooltip tooltip-placement='top' target="edit-{{user}}-roles">
                      Edit
                      </span>
                      <i id="edit-{{user}}-roles"
                      class='fas fa-user-edit add-btn'
                      ng-click="() => $ctrl.handleToggle(user)" />
                  </div>
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
