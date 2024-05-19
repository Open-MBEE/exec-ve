import { IPane, IRegion } from '@openmbee/pane-layout';

import { veAdminEvents } from '@ve-admin/types';
import { veAdmin } from '@ve-admin/ve-admin.module';
import { EventService } from '@ve-utils/core';
import { UserService } from '@ve-utils/mms-api-client';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { UserObject } from '@ve-types/mms';
import Role from '@ve-types/mms/permissions';

// Define component
export class UserListItemController implements angular.IComponentController {
    //Bindings
    user: UserObject | string;
    adminLabel: boolean;
    _key: string;
    adminState: boolean;
    label: boolean;
    permission: string;
    inherited: string = Role.NONE;
    className: string;

    //Parent Controllers
    $pane: IPane;
    resizer: Rx.Disposable;

    currentUser: UserObject;
    name: string;
    width: number = 0;
    classNames: string;
    minimizeClass: string;

    roles = Role;

    static $inject = ['$q', 'growl', 'UserService', 'EventService'];

    constructor(
        private $q: VeQService,
        private growl: angular.growl.IGrowlService,
        private userSvc: UserService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        const perm = this.permission;
        this.resizer = (this.$pane.$resized as Rx.Subject<IRegion>).subscribe(() => this.handleResize());
        this.handleResize();
        this.populateUserData().then(
            () => {
                if (this.currentUser) {
                    if (this.currentUser.fullName != 'null null') {
                        this.name = this.currentUser.fullName
                            ? this.currentUser.fullName
                            : `${this.currentUser.firstName} ${this.currentUser.lastName}`;
                    }
                }
                if (this.label) {
                    this.classNames = 'template-item minimize';
                    this.minimizeClass = 'minimize';
                } else {
                    this.minimizeClass = 'spacing minimize';
                }
            },
            (reason) => {
                this.growl.error('Problem retrieving user data: ' + reason.message);
            }
        );
    }

    $onDestroy(): void {
        this.resizer.dispose();
    }

    handleResize = (): void => {
        if (this.$pane.$region) {
            this.width = this.$pane.$region.width;
        }
    };

    populateUserData = (): VePromise<void> => {
        return new this.$q((resolve, reject) => {
            if (!this.label) {
                if (typeof this.user == 'string') {
                    // Set options for request

                    // Get user data
                    this.userSvc.getUserData(this.user).then((response) => {
                        this.currentUser = response;
                        resolve();
                    }, reject);
                } else {
                    this.currentUser = this.user;
                    resolve();
                }
            } else {
                if (typeof this.user != 'string') {
                    this.currentUser = this.user;
                }
                resolve();
            }
        });
    };

    handleClick = (e: JQuery.ClickEvent): void => {
        this.eventSvc.$broadcast<veAdminEvents.userSelectedData>('element.selected', {
            username: this.currentUser.username,
        });
        e.stopPropagation();
    };
}

// Render the user stat list items

const UserListItemComponent: VeComponentOptions = {
    selector: 'userListItem',
    controller: UserListItemController,
    bindings: {
        user: '<',
        adminLabel: '<',
        _key: '<',
        adminState: '<',
        label: '<',
        permission: '<',
        inherited: '<',
        className: '@',
    },
    require: {
        $pane: '^ngPane',
    },
    template: `
    <div class="stats-list-item {{ $ctrl.className }}">
    <div id="user-list-items" class="{{ $ctrl.classNames }}">
        <span ng-class="{'placeholder': !$ctrl.name}">
            <span ng-if="$ctrl.link" ui-sref="$ctrl.link" >{{ $ctrl.name ? $ctrl.name : '(none)' }}</span>
            <span ng-if="!$ctrl.link" ng-click="$ctrl.handleClick($event)">{{ $ctrl.name ? $ctrl.name : '(none)' }}</span>
        </span>
        <div ng-class="{'grayed-out' : !$ctrl.currentUser.enabled }">
            <span>{{ $ctrl.currentUser.username }}</span>
        </div>
        <div ng-if="!$ctrl.adminState">
            <div ng-class="{'grayed-out' : !$ctrl.currentUser.enabled }">
                <span>{{ $ctrl.currentUser.email }}</span>
            </div>
        </div>
    </div>
    <stat-list class-name="stats-list-member" ng-if="$ctrl.adminLabel">
        <stat stat-title="Admin"
            class-name="$ctrl.minimizeClass"
            stat-label="$ctrl.label"
            stat-icon="fa-solid {{ $ctrl.currentUser.admin ? 'fa-check' : 'fa-window-minimize' }}"
            _key="{{ $ctrl._key }}">
        </stat>
    </stat-list>
    <stat-list class-name="stats-list-member" key="statlist-perms" ng-show="$ctrl.width > 600" ng-if="!$ctrl.adminLabel">
        <stat stat-title="Read"
            class-name="$ctrl.minimizeClass"
            stat-label="$ctrl.label"
            stat-icon="fa-solid fa-check{{($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.READ) || $ctrl.currentUser.admin) ? ' grayed-out' : ''}}"
            no-tooltip="!($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.READ) || $ctrl.currentUser.admin)"
            tooltip="{{ ($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.READ) || $ctrl.currentUser.admin) ? ($ctrl.currentUser.admin) ? 'Server Admin (Read-Only)' : 'Inherited (Read-Only)' : '' }}"
            key="read-{{$ctrl.currentUser.username}}"
            _key="read-{{$ctrl.currentUser.username}}">
        </stat>
        <stat stat-title="Write"
            class-name="$ctrl.minimizeClass"
            stat-label="$ctrl.label"
            stat-icon="fa-solid {{ $ctrl.roles.ge($ctrl.permission,$ctrl.roles.WRITE) ? 'fa-check' : 'fa-window-minimize'}}{{($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.WRITE) || $ctrl.currentUser.admin) ? ' grayed-out' : ''}}"
            no-tooltip="!($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.WRITE) || $ctrl.currentUser.admin)"
            tooltip="{{ ($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.WRITE) || $ctrl.currentUser.admin) ? ($ctrl.currentUser.admin) ? 'Server Admin (Read-Only)' : 'Inherited (Read-Only)' : ''  }}"
            key="write-{{$ctrl.currentUser.username}}"
            _key="write-{{$ctrl.currentUser.username}}">
        </stat>
        <stat stat-title="Admin"
            class-name="$ctrl.minimizeClass"
            stat-label="$ctrl.label"
            stat-icon="fa-solid {{ $ctrl.roles.ge($ctrl.permission,$ctrl.roles.ADMIN) ? 'fa-check' : 'fa-window-minimize'}}{{($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.ADMIN) || $ctrl.currentUser.admin) ? ' grayed-out' : ''}}"
            no-tooltip="!($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.ADMIN) || $ctrl.currentUser.admin)"
            tooltip="{{ ($ctrl.roles.ge($ctrl.inherited,$ctrl.roles.ADMIN) || $ctrl.currentUser.admin) ? ($ctrl.currentUser.admin) ? 'Server Admin (Read-Only)' : 'Inherited (Read-Only)' : '' }}"
            key="admin-{{$ctrl.currentUser.username}}"
            _key="admin-{{$ctrl.currentUser.username}}">
        </stat>
    </stat-list>
</div>
    `,
};

veAdmin.component(UserListItemComponent.selector, UserListItemComponent);
