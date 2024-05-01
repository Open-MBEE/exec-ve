import { VeComponentOptions } from '@ve-types/angular';
import { UserObject } from '@ve-types/mms';

export class UserListController implements angular.IComponentController {
    users: UserObject[];
}

const UserListComponent: VeComponentOptions = {
    selector: 'userList',
    controller: UserListController,
    template: `
    <div id='workspace'>
        <div className='workspace-header header-box-depth'>
          <h2 className='workspace-title workspace-title-padding'>
            Users
          </h2>
          <div ng-class={'workspace-header-button': true}>
            <button class="btn btn-outline-primary" ng-click="$ctrl.handleCreateToggle">
                {{ ($ctrl.width > 600) ? 'Create' : "<i class='fa-solid fa-plus add-btn'/>" }}
            </button>
            <button class="btn btn-outline-danger" ng-click="$ctrl.handleDeleteToggle">
                {{ ($ctrl.width > 600) ? 'Delete' : '<i class="fa-solid fa-trash-alt delete-btn"/>' }}
            </button>
          </div>
        </div>
        <div id='workspace-body' class='extra-padding'>
            <div class='main-workspace list-item' ng-if="$ctrl.users.length === 0">
                <h3> No users. </h3>
            </div>
            <list ng-if="$ctrl.users.length > 0">
                <user-list-item class-name="head-info"
                    admin-state=true
                    label=true
                    user={{ 
                        {
                            fname: 'Name',
                            lname: '',
                            username: 'Username',
                            preferredName: 'Preferred Name',
                            email: 'E-mail',
                            admin: true,
                        } 
                    }}
                    admin-label=true
                    key='user-template'/>
                <div class="user-info" ng-repeat="user in $ctrl.users" key="user-info-{{user.username}}">
                    <user-list-item className='user-name'
                        admin-state=true
                        user=user
                        admin-label=true
                        _key="user-{{user.username}}"
                        />
                    <div className='controls-container'>
                        <span uib-tooltip tooltip-placement='top' target="edit-user-{{user.username}}">
                            Edit
                        </span>
                        <i id="edit-user-{{user.username}}"
                            ng-click={() => $ctrl.handleEditToggle(user)}
                            class='fas fa-user-edit add-btn'/>
                        <span uib-tooltip tooltip-placement='top' target="delete-{{user.username}}">
                            Delete
                        </span>
                        <i id="delete-{{user.username}}"
                            class='fas fa-trash-alt delete-btn'
                            ng-click={() => $ctrl.handleDeleteToggle(user.username)}/>
                    </div>
                </div>
            </list>
        </div>
    </div>
    `,
};
