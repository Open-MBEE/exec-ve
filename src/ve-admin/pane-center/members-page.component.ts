import { veAdmin } from '@ve-admin/ve-admin.module';

import { VeComponentOptions } from '@ve-types/angular';
import { OrgObject, PermissionMap, ProjectObject, UserObject } from '@ve-types/mms';

class MembersPageController implements angular.IComponentController {
    org?: OrgObject;
    project?: ProjectObject;

    //local
    admin: boolean;
    modal: boolean;
    selectedUser: UserObject;
    title: string;
    userperm: PermissionMap;
    users: string[];
    constructor() {}

    // Define toggle function
    handleToggle(username, perm) {
        // Verify username provided
        if (typeof username === 'string') {
            // Set selected user state
            this.setState({ selectedUser: { username, perm } });
        } else {
            this.setState({ selectedUser: null });
        }
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
              {(this.project && !this.org)
                ? (<MemberEdit project={this.project}
                               selectedUser={this.state.selectedUser}
                               refresh={this.refresh}/>)
                : (<MemberEdit org={this.org}
                               selectedUser={this.state.selectedUser}
                               refresh={this.refresh}/>)
              }
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
                <user-list-item className='user-name'
                                user={user}
                                permission={perm}
                                _key="key-{{user}}"
                <div class='controls-container'>
                <span uib-tooltip tooltip-placement='top' target="edit-{{user}}-roles">
                    Edit
                    </span>
                    <i id="edit-{{user}}-roles"
                    class='fas fa-user-edit add-btn'
                    ng-click="() => $ctrl.handleToggle(user, perm)" />
                </div>
                </div>
            </list>
          </div>
        </div>
      </div>
    `,
    controller: MembersPageController,
    bindings: {},
};

veAdmin.component(MembersPageComponent.selector, MembersPageComponent);
