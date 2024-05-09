import { IPane, IRegion } from '@openmbee/pane-layout';

import { IStatBindings } from '@ve-admin/components/stat/stat.component';
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
    className: string;

    //Parent Controllers
    $pane: IPane;
    resizer: Rx.Disposable;

    currentUser: UserObject;
    name: string;
    width: number = 0;
    classNames: string;
    minimizeClass: string;
    perm: string;

    stats: IStatBindings[];

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
                    this.name = this.currentUser.fullName
                        ? this.currentUser.fullName
                        : `${this.currentUser.firstName} ${this.currentUser.lastName}`;
                }
                if (this.label) {
                    this.classNames = 'template-item minimize';
                    this.minimizeClass = 'minimize';
                }

                if (this.adminLabel && this.currentUser.admin) {
                    this.stats = [
                        {
                            title: 'Admin',
                            icon: 'fa-solid fa-check',
                            className: this.minimizeClass,
                            label: this.label,
                            _key: this._key,
                        },
                    ];
                } else if (perm) {
                    if (!this.label) {
                        this.minimizeClass = 'spacing minimize';
                    }
                    // Verify which permissions user has
                    if (perm === Role.ADMIN) {
                        // Add read permission check
                        this.stats = [
                            {
                                title: 'Read',
                                icon: 'fa-solid fa-check',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `read-${this.currentUser.username}`,
                                _key: `read-${this.currentUser.username}`,
                            },
                            {
                                title: 'Write',
                                icon: 'fa-solid fa-check',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `write-${this.currentUser.username}`,
                                _key: `write-${this.currentUser.username}`,
                            },
                            {
                                title: 'Admin',
                                icon: 'fa-solid fa-check',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `admin-${this.currentUser.username}`,
                                _key: `admin-${this.currentUser.username}`,
                            },
                        ];
                    } else if (perm === Role.WRITE) {
                        this.stats = [
                            {
                                title: 'Read',
                                icon: 'fa-solid fa-check',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `read-${this.currentUser.username}`,
                                _key: `read-${this.currentUser.username}`,
                            },
                            {
                                title: 'Write',
                                icon: 'fa-solid fa-check',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `write-${this.currentUser.username}`,
                                _key: `write-${this.currentUser.username}`,
                            },
                            {
                                title: 'Admin',
                                icon: 'fa-solid fa-window-minimize',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `admin-${this.currentUser.username}`,
                                _key: `admin-${this.currentUser.username}`,
                            },
                        ];
                    } else if (perm === Role.READ) {
                        // Add admin permission check
                        this.stats = [
                            {
                                title: 'Read',
                                icon: 'fa-solid fa-check',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `read-${this.currentUser.username}`,
                                _key: `read-${this.currentUser.username}`,
                            },
                            {
                                title: 'Write',
                                icon: 'fa-solid fa-window-minimize',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `write-${this.currentUser.username}`,
                                _key: `write-${this.currentUser.username}`,
                            },
                            {
                                title: 'Admin',
                                icon: 'fa-solid fa-window-minimize',
                                className: this.minimizeClass,
                                label: this.label,
                                noTooltip: true,
                                key: `admin-${this.currentUser.username}`,
                                _key: `admin-${this.currentUser.username}`,
                            },
                        ];
                    }
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
        className: '<',
    },
    require: {
        $pane: '^ngPane',
    },
    template: `
    <div class="stats-list-item {{ $ctrl.className }}">
    <div id="user-list-items" class="{{ $ctrl.classNames }}">
        <span ng-if="$ctrl.link" ui-sref="$ctrl.link" n>{{ $ctrl.name }}</span>
        <span ng-if="!$ctrl.link" ng-click="$ctrl.handleClick($event)">{{ $ctrl.name }}</span>
        <div ng-class="{'grayed-out' : !$ctrl.currentUser.enabled }">
            <span>{{ $ctrl.currentUser.username }}</span>
        </div>
        <div ng-if="$ctrl.adminState">
            <div ng-class="{'grayed-out' : !$ctrl.currentUser.enabled }">
                <span>{{ $ctrl.currentUser.firstName }}</span>
            </div>
            <div ng-class="{'grayed-out' : !$ctrl.currentUser.enabled }">
                <span>{{ $ctrl.currentUser.email }}</span>
            </div>
        </div>
    </div>
    <stat-list class-name="stats-list-member" key="statlist-perms" ng-show="$ctrl.width > 600">
        <stat ng-repeat="stat in $ctrl.stats" 
                stat-title="stat.title" 
                stat-label="stat.label"
                stat-icon="stat.icon" 
                stat-value="stat.value" 
                class-name="stat.className" 
                divider="stat.divider"
                no-tooltip="stat.noTooltip"
                ng-show="$ctrl.width && $ctrl.getTotalStatsWidth() <= $ctrl.width">
        </stat>
    </stat-list>
</div>
    `,
};

veAdmin.component(UserListItemComponent.selector, UserListItemComponent);
