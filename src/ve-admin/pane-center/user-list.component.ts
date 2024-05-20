import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdmin } from '@ve-admin';
import { RootScopeService } from '@ve-utils/application';

import { VeComponentOptions } from '@ve-types/angular';
import { UserObject } from '@ve-types/mms';

class UserListController implements angular.IComponentController {
    //Bindings
    user: UserObject;
    users: UserObject[];

    width: number;

    //Ng-Pane
    $pane: IPane;
    $resized: Rx.Disposable;

    userTemplate = {
        fullName: 'Name',
        username: 'Username',
        email: 'Email',
        admin: true,
        enabled: true,
    };

    static $inject = ['RootScopeService'];

    constructor(private rootScopeSvc: RootScopeService) {}

    $onInit(): void {
        this.rootScopeSvc.rightPaneClosed(true);
        this.rootScopeSvc.leftPaneClosed(true);
        this.$resized = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());

        this.handleResize();
    }

    handleResize = (): void => {
        if (this.$pane.$region) {
            this.width = this.$pane.$region.width;
        }
        //this.$scope.$apply();
    };
}

const UserListComponent: VeComponentOptions = {
    selector: 'userList',
    controller: UserListController,
    bindings: {
        user: '<currentUser',
        users: '<mmsUsers',
    },
    require: {
        $pane: '^ngPane',
    },
    template: `
    <div class="workspace-header home-header">
    <h2 class='workspace-title workspace-title-padding'>
        Users
    </h2>
    <div class="workspace-header-button">
        <button class="btn btn-primary" ng-click="$ctrl.handleCreateToggle()">
            <span ng-if="$ctrl.width > 600">Create</span>
            <i ng-if="$ctrl.width <= 600" class="fas fa-plus add-btn"></i>
        </button>
        <button class="btn btn-danger" ng-click="$ctrl.handleDeleteToggle()" ng-if="$ctrl.user.admin">
            <span ng-if="$ctrl.width > 600">Delete</span>
            <i ng-if="$ctrl.width <= 600" class="fas fa-trash-alt delete-btn"></i>
        </button>
    </div>
</div>
<div id="grp-expand-collapse">
    <button id="btn-expand" type="button" name="expand" ng-click="$ctrl.handleExpandCollapse($event)">
      [ Expand ]
    </button>
    <button id="btn-collapse" type="button" name="collapse" ng-click="$ctrl.handleExpandCollapse($event)">
      [ Collapse ]
    </button>
</div>
<div id="workspace-body" class="extra-padding">
    <div ng-if="$ctrl.users.length === 0" class="list-item"><h3>No users.</h3></div>
    <list>
        <div class="template-header" key="user-info-template">
            <user-list-item class-name="user-name"
                admin-state="true"
                admin-label="true"
                user="$ctrl.userTemplate"
                label="true"
                key="user-template"/>
        </div>
        <div ng-repeat="user in $ctrl.users" class="user-info" key="user-info-{{user.username}}">
            <user-list-item class-name="user-name"
                admin-state="true"
                admin-label="true"
                user="user"
                link="admin.user.profile({ userId: user.username})
                _key="key-{{user}}">
            </user-list-item>
            <span uib-tooltip="Edit" tooltip-placement="top" ng-if="$ctrl.user.username == user.username || $ctrl.user.admin" target="edit-user-{{user.username}}">
                <i id="edit-user-{{user.username}}"
                    ng-click="$ctrl.handleEditToggle(user)"
                    class="fas fa-user-edit add-btn"></i>
            </span>
            <span uib-tooltip="Delete" tooltip-placement="top" target="delete-{{user.username}}" ng-if="$ctrl.user.admin">
                <i id="delete-{{user.username}}"
                    class="fas fa-trash-alt delete-btn"
                    ng-click="$ctrl.handleDeleteToggle(user.username)"></i>
            </span>
        </div>
    </list>
</div>
    `,
};

veAdmin.component(UserListComponent.selector, UserListComponent);
